from datetime import datetime
from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required
from routes.payments import calculate_penalty, PENALTY_RATE_TIER2

invoices_bp = Blueprint('invoices', __name__)


def format_invoice_no(invoice_id):
    return f'INV-{invoice_id:05d}'


def next_month_str(month_str):
    dt = datetime.strptime(month_str, '%B %Y')
    year = dt.year + (1 if dt.month == 12 else 0)
    month = 1 if dt.month == 12 else dt.month + 1
    return datetime(year, month, 1).strftime('%B %Y')


def build_invoice_fields(unit, month, penalty=0):
    rent_amount = unit['rent_amount']
    # Water is billed and paid separately (e.g. directly to Eldowas) for units
    # with has_water_bill=1, confirmed and receipted via /api/water-bills —
    # it is intentionally never bundled into the rent invoice total.
    water_amount = 0
    total_amount = rent_amount + water_amount + penalty
    month_start = datetime.strptime(month, '%B %Y')
    due_date = month_start.replace(day=unit['penalty_date']).strftime('%Y-%m-%d')
    return {
        'rent_amount': rent_amount,
        'water_amount': water_amount,
        'penalty': penalty,
        'total_amount': total_amount,
        'due_date': due_date,
    }


def refresh_invoice_penalty(conn, invoice, now):
    """Recompute penalty/total_amount for an unpaid/partial invoice against
    today's date. Penalty is only set once at invoice creation otherwise, so
    an invoice generated before the due date would never pick up a penalty
    even if the tenant ends up paying late. Persists the change so listings,
    balances, and payment amounts all reflect the escalation. Returns the
    (possibly updated) penalty and total_amount.
    """
    if invoice['status'] not in ('unpaid', 'partial'):
        return invoice['penalty'], invoice['total_amount']

    if invoice['penalty_exempt']:
        return 0, invoice['rent_amount'] + invoice['water_amount']

    invoice_month_start = datetime.strptime(invoice['month'], '%B %Y')
    now_month_start = datetime(now.year, now.month, 1)

    if now_month_start > invoice_month_start:
        # the invoice's whole month has elapsed unpaid — treat as maximally overdue
        new_penalty = invoice['rent_amount'] * PENALTY_RATE_TIER2
    elif now_month_start < invoice_month_start:
        # invoice for a future month (e.g. pre-generated) — not due yet
        new_penalty = 0
    else:
        new_penalty = calculate_penalty(invoice['rent_amount'], now.strftime('%Y-%m-%d'))

    new_total = invoice['rent_amount'] + invoice['water_amount'] + new_penalty

    if abs(new_penalty - invoice['penalty']) >= 0.01:
        conn.execute(
            'UPDATE invoices SET penalty = ?, total_amount = ? WHERE invoice_id = ?',
            (new_penalty, new_total, invoice['invoice_id'])
        )

    return new_penalty, new_total


FIRST_INVOICE_HALF_RENT_DAY = 15
FIRST_INVOICE_SKIP_TO_NEXT_MONTH_DAY = 25


def _first_invoice_terms(unit, now):
    """A brand new tenant's very first invoice is prorated by how far into
    the month they moved in, and always penalty-exempt:
      - before day 15  -> full rent, current month
      - day 15-24      -> half rent, current month
      - day 25+        -> too close to month-end; skip to next month, full rent
    """
    day = now.day
    current_month = now.strftime('%B %Y')
    if day < FIRST_INVOICE_HALF_RENT_DAY:
        return current_month, unit['rent_amount']
    elif day < FIRST_INVOICE_SKIP_TO_NEXT_MONTH_DAY:
        return current_month, round(unit['rent_amount'] / 2)
    else:
        return next_month_str(current_month), unit['rent_amount']


def _create_invoice_row(conn, tenant, unit, month, now, due_date_override=None,
                         rent_override=None, penalty_exempt=False, message_override=None):
    """Core invoice-creation logic shared by the manual endpoint, the
    automatic monthly generator, and a new tenant's prorated first invoice.
    Returns the created invoice dict, or None if an invoice for this
    unit/month already exists (skipped, not an error).

    Whichever entry point reaches this first for a given tenant, if it turns
    out to be their very first invoice ever, the first-invoice terms (see
    _first_invoice_terms) always apply — overriding whatever month/rent the
    caller asked for. This makes it impossible for a tenant's first bill to
    accidentally skip proration/penalty-exemption just because it was created
    via the manual "Generate Invoice" button or the daily auto-generator
    instead of the dedicated contract-approval flow.
    """
    is_first_invoice = conn.execute(
        'SELECT COUNT(*) FROM invoices WHERE tenant_id = ?', (tenant['user_id'],)
    ).fetchone()[0] == 0

    if is_first_invoice:
        month, rent_override = _first_invoice_terms(unit, now)
        penalty_exempt = True

    existing = conn.execute(
        "SELECT * FROM invoices WHERE unit_id = ? AND month = ? AND status != 'void'",
        (unit['unit_id'], month)
    ).fetchone()
    if existing:
        return None

    penalty = 0 if penalty_exempt else calculate_penalty(unit['rent_amount'], now.strftime('%Y-%m-%d'))
    fields = build_invoice_fields(unit, month, penalty)
    rent_amount = rent_override if rent_override is not None else fields['rent_amount']
    water_amount = fields['water_amount']
    total_amount = rent_amount + water_amount + penalty
    due_date = due_date_override or fields['due_date']

    created_at = now.strftime('%Y-%m-%d %H:%M:%S')

    cursor = conn.execute('''
        INSERT INTO invoices
        (tenant_id, unit_id, month, rent_amount, water_amount, penalty, total_amount, amount_paid, due_date, status, created_at, penalty_exempt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'unpaid', ?, ?)
    ''', (tenant['user_id'], unit['unit_id'], month, rent_amount, water_amount, penalty, total_amount, due_date, created_at, 1 if penalty_exempt else 0))

    invoice_id = cursor.lastrowid

    if message_override:
        message = message_override
    elif is_first_invoice:
        proration_note = 'for your first month' if rent_amount >= unit['rent_amount'] else "prorated to half rent since you're moving in mid-month"
        message = (
            f"Welcome, {tenant['full_name']}! Your tenancy for House {unit['unit_number']} is confirmed. "
            f"Your first rent invoice ({month}) is Ksh {rent_amount:,.0f} {proration_note}, "
            f"no late penalty applies to this one. Pay it via the property paybill — this is separate "
            f"from your security deposit, which is handled separately by the office."
        )
    else:
        message = (
            f"Dear {tenant['full_name']}, your invoice for House {unit['unit_number']} for {month} is ready. "
            f"Amount due: Ksh {total_amount:,.0f}. Please pay by {due_date}."
        )

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, ?, 'sent')
    ''', (
        tenant['phone'],
        message,
        created_at,
    ))

    return {
        'invoice_id': invoice_id,
        'invoice_no': format_invoice_no(invoice_id),
        'tenant_id': tenant['user_id'],
        'tenant_name': tenant['full_name'],
        'unit_id': unit['unit_id'],
        'unit_number': unit['unit_number'],
        'month': month,
        'rent_amount': rent_amount,
        'water_amount': water_amount,
        'penalty': penalty,
        'total_amount': total_amount,
        'amount_paid': 0,
        'balance_due': total_amount,
        'due_date': due_date,
        'status': 'unpaid',
        'penalty_exempt': penalty_exempt,
    }


def generate_first_invoice_for_tenant(conn, tenant, unit, now=None):
    """Create a new tenant's very first invoice, right after their contract
    is approved. The actual proration/exemption decision now lives centrally
    in _create_invoice_row (it applies no matter which entry point ends up
    creating a tenant's first invoice — this one, the manual 'Generate
    Invoice' button, or the daily auto-generator), so this is just the
    contract-approval entry point into that shared logic. Returns None if
    this tenant already has invoice history (e.g. it was already created via
    another path before the contract was approved)."""
    now = now or datetime.now()

    already_invoiced = conn.execute(
        'SELECT COUNT(*) FROM invoices WHERE tenant_id = ?', (tenant['user_id'],)
    ).fetchone()[0]
    if already_invoiced:
        return None

    return _create_invoice_row(conn, tenant, unit, now.strftime('%B %Y'), now)


def generate_monthly_invoices(conn, month=None):
    """Auto-generate the given month's (default: current month) invoice for
    every active tenant who doesn't already have one — used by both the
    scheduled job and the admin 'run now' button. Skips units that already
    have an invoice for the month (e.g. one auto-created early by an
    overpayment rollover), so it's always safe to re-run. Returns the list of
    newly created invoices."""
    now = datetime.now()
    target_month = month or now.strftime('%B %Y')
    target_month_start = datetime.strptime(target_month, '%B %Y')

    active_tenants = conn.execute(
        "SELECT * FROM users WHERE role = 'tenant' AND status = 'active' AND unit_id IS NOT NULL"
    ).fetchall()

    created = []
    for tenant in active_tenants:
        unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (tenant['unit_id'],)).fetchone()
        if not unit:
            continue

        # If this tenant's most recent invoice is already for the target
        # month or a later one (e.g. their first-ever invoice was
        # deliberately pushed to next month because they joined too late in
        # this one — see _first_invoice_terms), there's nothing due for the
        # target month at all; creating one here would bill them for a
        # period they never actually owed.
        latest = conn.execute(
            "SELECT month FROM invoices WHERE unit_id = ? AND status != 'void' ORDER BY invoice_id DESC LIMIT 1",
            (unit['unit_id'],)
        ).fetchone()
        if latest and datetime.strptime(latest['month'], '%B %Y') >= target_month_start:
            continue

        invoice = _create_invoice_row(conn, tenant, unit, target_month, now)
        if invoice:
            created.append(invoice)

    conn.commit()
    return created


@invoices_bp.route('/api/invoices', methods=['POST'])
@role_required('admin', 'landlord')
def create_invoice():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    if not unit_id:
        return jsonify({'error': 'unit_id is required'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()
    if not tenant:
        conn.close()
        return jsonify({'error': 'No active tenant found for this unit'}), 404

    now = datetime.now()
    month = data.get('month') or now.strftime('%B %Y')

    invoice = _create_invoice_row(conn, tenant, unit, month, now, due_date_override=data.get('due_date'))
    if not invoice:
        conn.close()
        return jsonify({'error': f'An invoice for {month} already exists for this unit'}), 400

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Invoice created successfully',
        'invoice': invoice,
    }), 201


@invoices_bp.route('/api/invoices/generate-monthly', methods=['POST'])
@role_required('admin', 'landlord')
def trigger_monthly_generation():
    data = request.get_json(silent=True) or {}
    month = data.get('month')

    conn = get_db()
    created = generate_monthly_invoices(conn, month)
    conn.close()

    return jsonify({
        'message': f'{len(created)} invoice(s) generated' if created else 'No new invoices needed — everyone already has one for this month',
        'invoices': created,
    }), 200


@invoices_bp.route('/api/invoices', methods=['GET'])
@login_required
def get_invoices():
    conn = get_db()

    if session['role'] in ('admin', 'landlord'):
        invoices = conn.execute('''
            SELECT i.*, u.full_name AS tenant_name, un.unit_number
            FROM invoices i
            JOIN users u ON i.tenant_id = u.user_id
            JOIN units un ON i.unit_id = un.unit_id
            ORDER BY i.created_at DESC
        ''').fetchall()
    elif session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        property_id = agent['assigned_property_id'] if agent else None
        invoices = conn.execute('''
            SELECT i.*, u.full_name AS tenant_name, un.unit_number
            FROM invoices i
            JOIN users u ON i.tenant_id = u.user_id
            JOIN units un ON i.unit_id = un.unit_id
            WHERE un.property_id = ?
            ORDER BY i.created_at DESC
        ''', (property_id,)).fetchall() if property_id else []
    else:
        invoices = conn.execute('''
            SELECT i.*, un.unit_number
            FROM invoices i
            JOIN units un ON i.unit_id = un.unit_id
            WHERE i.tenant_id = ?
            ORDER BY i.created_at DESC
        ''', (session['user_id'],)).fetchall()

    now = datetime.now()
    result = []
    for i in invoices:
        row = dict(i)
        if row['status'] in ('unpaid', 'partial'):
            penalty, total_amount = refresh_invoice_penalty(conn, row, now)
            row['penalty'] = penalty
            row['total_amount'] = total_amount
        row['invoice_no'] = format_invoice_no(row['invoice_id'])
        row['balance_due'] = row['total_amount'] - row['amount_paid']
        result.append(row)

    conn.commit()
    conn.close()

    return jsonify(result), 200


@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['GET'])
@login_required
def get_invoice(invoice_id):
    conn = get_db()

    invoice = conn.execute('''
        SELECT i.*, u.full_name AS tenant_name, un.unit_number
        FROM invoices i
        JOIN users u ON i.tenant_id = u.user_id
        JOIN units un ON i.unit_id = un.unit_id
        WHERE i.invoice_id = ?
    ''', (invoice_id,)).fetchone()

    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404

    if session['role'] == 'agent':
        from routes.tenant import agent_can_access_tenant
        tenant = conn.execute('SELECT * FROM users WHERE user_id = ?', (invoice['tenant_id'],)).fetchone()
        if not tenant or not agent_can_access_tenant(conn, tenant):
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403
    elif session['role'] not in ('admin', 'landlord') and invoice['tenant_id'] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    invoice_data = dict(invoice)
    if invoice_data['status'] in ('unpaid', 'partial'):
        penalty, total_amount = refresh_invoice_penalty(conn, invoice_data, datetime.now())
        invoice_data['penalty'] = penalty
        invoice_data['total_amount'] = total_amount
        conn.commit()

    conn.close()

    invoice_data['invoice_no'] = format_invoice_no(invoice_data['invoice_id'])
    invoice_data['balance_due'] = invoice_data['total_amount'] - invoice_data['amount_paid']

    return jsonify(invoice_data), 200


@invoices_bp.route('/api/invoices/<int:invoice_id>/receipt/pdf', methods=['GET'])
@login_required
def download_invoice_receipt_pdf(invoice_id):
    """A receipt tied to a specific month's invoice rather than a specific
    payment — so a tenant who prepays several months in one go (or pays a
    single month across several installments) can still pull up exactly one
    month's receipt on its own, whenever that month is relevant, regardless
    of how or when the money actually moved."""
    from flask import send_file
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_db()

    invoice = conn.execute('''
        SELECT i.*, u.full_name AS tenant_name, un.unit_number, pr.name AS property_name
        FROM invoices i
        JOIN users u ON i.tenant_id = u.user_id
        JOIN units un ON i.unit_id = un.unit_id
        JOIN properties pr ON un.property_id = pr.property_id
        WHERE i.invoice_id = ?
    ''', (invoice_id,)).fetchone()

    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404

    if session['role'] == 'agent':
        from routes.tenant import agent_can_access_tenant
        tenant = conn.execute('SELECT * FROM users WHERE user_id = ?', (invoice['tenant_id'],)).fetchone()
        if not tenant or not agent_can_access_tenant(conn, tenant):
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403
    elif session['role'] not in ('admin', 'landlord') and invoice['tenant_id'] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    if invoice['amount_paid'] <= 0:
        conn.close()
        return jsonify({'error': 'Nothing has been paid on this invoice yet.'}), 400

    contributions = conn.execute('''
        SELECT pa.amount, p.mpesa_code, p.payment_date, p.phone_used
        FROM payment_allocations pa
        JOIN payments p ON pa.payment_id = p.payment_id
        WHERE pa.invoice_id = ?
        ORDER BY p.payment_date ASC
    ''', (invoice_id,)).fetchall()
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"{invoice['property_name']} — Rent Receipt", styles['Title']))
    elements.append(Spacer(1, 16))

    balance_due = invoice['total_amount'] - invoice['amount_paid']
    receipt_data = [
        ['Receipt For', f"{invoice['month']} (INV-{invoice['invoice_id']:05d})"],
        ['Tenant', invoice['tenant_name']],
        ['House', f"House {invoice['unit_number']}"],
        ['Rent Amount', f"Ksh {invoice['rent_amount']:,.0f}"],
        ['Penalty', f"Ksh {invoice['penalty']:,.0f}"],
        ['Amount Paid', f"Ksh {invoice['amount_paid']:,.0f}"],
        ['Balance Remaining', f"Ksh {balance_due:,.0f}" if balance_due > 0 else 'Ksh 0 — Fully Paid'],
        ['Status', invoice['status'].upper()],
    ]
    receipt_table = Table(receipt_data, colWidths=[160, 240])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5ee')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(receipt_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Payment(s) Applied", styles['Heading2']))
    if contributions:
        rows = [['M-Pesa Code', 'Date', 'Phone', 'Amount Applied']]
        for c in contributions:
            rows.append([
                c['mpesa_code'] or '—',
                c['payment_date'],
                c['phone_used'],
                f"Ksh {c['amount']:,.0f}",
            ])
        contrib_table = Table(rows, colWidths=[110, 90, 110, 110])
        contrib_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f5ee')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(contrib_table)
    else:
        elements.append(Paragraph("No payment on record for this invoice.", styles['Normal']))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Thank you for your payment.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"rent-receipt-INV-{invoice['invoice_id']:05d}.pdf"
    )


@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_invoice(invoice_id):
    conn = get_db()

    invoice = conn.execute('SELECT * FROM invoices WHERE invoice_id = ?', (invoice_id,)).fetchone()
    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404

    if invoice['amount_paid'] > 0:
        conn.close()
        return jsonify({'error': 'Cannot delete an invoice that has payments applied to it'}), 400

    conn.execute('DELETE FROM invoices WHERE invoice_id = ?', (invoice_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Invoice deleted successfully'}), 200
