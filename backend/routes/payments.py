import io
from flask import Blueprint, request, jsonify, session, send_file
from database import get_db
from routes.decorators import login_required, role_required

payments_bp = Blueprint('payments', __name__)


PENALTY_GRACE_DAY = 5
PENALTY_ESCALATION_DAY = 10
PENALTY_RATE_TIER1 = 0.05
PENALTY_RATE_TIER2 = 0.10


def calculate_penalty(rent_amount, payment_date_str):
    day = int(payment_date_str.split('-')[2])
    if day <= PENALTY_GRACE_DAY:
        return 0
    elif day <= PENALTY_ESCALATION_DAY:
        return rent_amount * PENALTY_RATE_TIER1
    else:
        return rent_amount * PENALTY_RATE_TIER2


def allocate_payment_to_invoices(conn, tenant, unit, payment_id, amount, payment_date, created_at):
    """Apply a payment across the tenant's outstanding invoices, oldest first.
    Any amount left over after clearing all outstanding invoices is used to
    auto-generate and immediately (fully or partially) pay future months'
    invoices, so advance payments are tracked month-by-month rather than
    left as an untracked lump sum.
    """
    from datetime import datetime
    from routes.invoices import build_invoice_fields, format_invoice_no, next_month_str, refresh_invoice_penalty

    now = datetime.now()
    remaining = amount
    allocations = []

    outstanding = conn.execute('''
        SELECT * FROM invoices
        WHERE unit_id = ? AND status IN ('unpaid', 'partial')
        ORDER BY due_date ASC, invoice_id ASC
    ''', (unit['unit_id'],)).fetchall()

    for inv in outstanding:
        if remaining <= 0:
            break
        inv_penalty, inv_total = refresh_invoice_penalty(conn, inv, now)
        balance_due = inv_total - inv['amount_paid']
        applied = min(balance_due, remaining)
        if applied <= 0:
            continue

        new_amount_paid = inv['amount_paid'] + applied
        new_status = 'paid' if new_amount_paid >= inv_total - 0.01 else 'partial'

        conn.execute('''
            UPDATE invoices
            SET amount_paid = ?, status = ?, payment_id = ?,
                paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END
            WHERE invoice_id = ?
        ''', (new_amount_paid, new_status, payment_id, new_status, payment_date, inv['invoice_id']))

        conn.execute('''
            INSERT INTO payment_allocations (payment_id, invoice_id, amount, created_at)
            VALUES (?, ?, ?, ?)
        ''', (payment_id, inv['invoice_id'], applied, created_at))

        allocations.append({
            'invoice_id': inv['invoice_id'],
            'invoice_no': format_invoice_no(inv['invoice_id']),
            'month': inv['month'],
            'amount_applied': applied,
            'status': new_status,
        })
        remaining -= applied

    if outstanding:
        last_month = outstanding[-1]['month']
    else:
        latest_invoice = conn.execute(
            'SELECT month FROM invoices WHERE unit_id = ? ORDER BY invoice_id DESC LIMIT 1',
            (unit['unit_id'],)
        ).fetchone()
        last_month = latest_invoice['month'] if latest_invoice else None

    while remaining > 0.01:
        if last_month is None:
            next_month = now.strftime('%B %Y')
        else:
            next_month = next_month_str(last_month)

        fields = build_invoice_fields(unit, next_month, penalty=0)
        applied = min(fields['total_amount'], remaining)
        status = 'paid' if applied >= fields['total_amount'] - 0.01 else 'partial'

        cursor = conn.execute('''
            INSERT INTO invoices
            (tenant_id, unit_id, month, rent_amount, water_amount, penalty, total_amount,
             amount_paid, due_date, status, payment_id, created_at, paid_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            tenant['user_id'], unit['unit_id'], next_month,
            fields['rent_amount'], fields['water_amount'], fields['penalty'], fields['total_amount'],
            applied, fields['due_date'], status, payment_id, created_at,
            payment_date if status == 'paid' else None
        ))
        new_invoice_id = cursor.lastrowid

        conn.execute('''
            INSERT INTO payment_allocations (payment_id, invoice_id, amount, created_at)
            VALUES (?, ?, ?, ?)
        ''', (payment_id, new_invoice_id, applied, created_at))

        allocations.append({
            'invoice_id': new_invoice_id,
            'invoice_no': format_invoice_no(new_invoice_id),
            'month': next_month,
            'amount_applied': applied,
            'status': status,
        })
        remaining -= applied
        last_month = next_month

    return allocations


@payments_bp.route('/api/payments', methods=['POST'])
def create_payment():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    phone_used = data.get('phone_used')

    if not all([unit_id, phone_used]):
        return jsonify({'error': 'unit_id and phone_used are required'}), 400

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

    invoice = conn.execute('''
        SELECT * FROM invoices
        WHERE unit_id = ? AND status IN ('unpaid', 'partial')
        ORDER BY due_date ASC, invoice_id ASC LIMIT 1
    ''', (unit_id,)).fetchone()

    from datetime import datetime
    from routes.invoices import refresh_invoice_penalty
    now = datetime.now()
    payment_date = now.strftime('%Y-%m-%d')
    created_at = now.strftime('%Y-%m-%d %H:%M:%S')

    requested_amount = data.get('amount')

    if invoice:
        penalty, total_amount = refresh_invoice_penalty(conn, invoice, now)
        balance_due = total_amount - invoice['amount_paid']
    else:
        # nothing currently outstanding — this is a tenant paying ahead for a
        # future month. There's nothing to default the amount to, so it must
        # be given explicitly; allocate_payment_to_invoices below will create
        # and apply it against the next invoice in line.
        penalty, balance_due = 0, None

    if requested_amount is not None:
        try:
            amount = float(requested_amount)
        except (TypeError, ValueError):
            conn.close()
            return jsonify({'error': 'Enter a valid amount.'}), 400
        if amount <= 0:
            conn.close()
            return jsonify({'error': 'Amount must be greater than zero.'}), 400
    elif invoice:
        amount = balance_due
    else:
        conn.close()
        return jsonify({'error': "You're all caught up — enter an amount to pay ahead for next month."}), 400

    import random
    mpesa_code = 'SIM' + ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=8))

    payment_month = invoice['month'] if invoice else now.strftime('%B %Y')

    cursor = conn.execute('''
        INSERT INTO payments
        (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')
    ''', (tenant['user_id'], unit_id, amount, mpesa_code, phone_used, payment_date, payment_month))

    payment_id = cursor.lastrowid

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, ?, 'sent')
    ''', (
        tenant['phone'],
        (f"Dear {tenant['full_name']}, we have received your rent payment of Ksh {amount:,.0f} for House {unit['unit_number']}. Thank you!"
         if invoice else
         f"Dear {tenant['full_name']}, we have received your advance rent payment of Ksh {amount:,.0f} for House {unit['unit_number']}, applied towards your upcoming rent. Thank you!"),
        created_at,
    ))

    allocations = allocate_payment_to_invoices(conn, tenant, unit, payment_id, amount, payment_date, created_at)

    primary = allocations[0] if allocations else None

    balance_remaining = 0
    if primary:
        settled_invoice = conn.execute(
            'SELECT total_amount, amount_paid FROM invoices WHERE invoice_id = ?', (primary['invoice_id'],)
        ).fetchone()
        balance_remaining = max(settled_invoice['total_amount'] - settled_invoice['amount_paid'], 0)

    conn.commit()
    conn.close()

    receipt = {
        'receipt_no': f'RCT-{payment_id:05d}',
        'payment_id': payment_id,
        'unit_number': unit['unit_number'],
        'tenant_name': tenant['full_name'],
        'rent_amount': unit['rent_amount'],
        'penalty': penalty,
        'amount_paid': amount,
        'balance_remaining': balance_remaining,
        'mpesa_code': mpesa_code,
        'payment_date': payment_date,
        'month': primary['month'] if primary else payment_month,
        'invoice_no': primary['invoice_no'] if primary else None,
    }

    return jsonify({
        'message': 'Payment recorded successfully',
        'receipt': receipt
    }), 201


@payments_bp.route('/api/payments', methods=['GET'])
@login_required
def get_payments():
    conn = get_db()

    if session['role'] in ('admin', 'landlord'):
        payments = conn.execute('''
            SELECT p.*, u.full_name AS tenant_name, un.unit_number
            FROM payments p
            JOIN users u ON p.tenant_id = u.user_id
            JOIN units un ON p.unit_id = un.unit_id
            ORDER BY p.payment_date DESC
        ''').fetchall()
    elif session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        property_id = agent['assigned_property_id'] if agent else None
        payments = conn.execute('''
            SELECT p.*, u.full_name AS tenant_name, un.unit_number
            FROM payments p
            JOIN users u ON p.tenant_id = u.user_id
            JOIN units un ON p.unit_id = un.unit_id
            WHERE un.property_id = ?
            ORDER BY p.payment_date DESC
        ''', (property_id,)).fetchall() if property_id else []
    else:
        payments = conn.execute('''
            SELECT p.*, un.unit_number
            FROM payments p
            JOIN units un ON p.unit_id = un.unit_id
            WHERE p.tenant_id = ?
            ORDER BY p.payment_date DESC
        ''', (session['user_id'],)).fetchall()

    conn.close()
    return jsonify([dict(p) for p in payments]), 200


@payments_bp.route('/api/payments/manual', methods=['POST'])
@role_required('admin', 'landlord', 'agent')
def create_manual_payment():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    amount = data.get('amount')
    mpesa_code = data.get('mpesa_code')
    phone_used = data.get('phone_used')
    payment_date = data.get('payment_date')
    month = data.get('month')

    if not all([unit_id, amount, phone_used, payment_date, month]):
        return jsonify({'error': 'unit_id, amount, phone_used, payment_date and month are required'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    if session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        if not agent or unit['property_id'] != agent['assigned_property_id']:
            conn.close()
            return jsonify({'error': 'you are not allowed'}), 403

    tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()

    if not tenant:
        conn.close()
        return jsonify({'error': 'No active tenant found for this unit'}), 404

    from datetime import datetime
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor = conn.execute('''
        INSERT INTO payments
        (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')
    ''', (tenant['user_id'], unit_id, amount, mpesa_code, phone_used, payment_date, month))

    payment_id = cursor.lastrowid

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, ?, 'sent')
    ''', (
        tenant['phone'],
        f"Dear {tenant['full_name']}, we have recorded a payment of Ksh {amount:,.0f} for House {unit['unit_number']} ({month}). Thank you!",
        created_at,
    ))

    allocations = allocate_payment_to_invoices(conn, tenant, unit, payment_id, amount, payment_date, created_at)

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Manual payment recorded successfully',
        'payment_id': payment_id,
        'allocations': allocations,
    }), 201


@payments_bp.route('/api/payments/<int:payment_id>/receipt/pdf', methods=['GET'])
def download_receipt_pdf(payment_id):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_db()
    payment = conn.execute('''
        SELECT p.*, u.full_name AS tenant_name, un.unit_number, pr.name AS property_name
        FROM payments p
        JOIN users u ON p.tenant_id = u.user_id
        JOIN units un ON p.unit_id = un.unit_id
        JOIN properties pr ON un.property_id = pr.property_id
        WHERE p.payment_id = ?
    ''', (payment_id,)).fetchone()

    if not payment:
        conn.close()
        return jsonify({'error': 'Payment not found'}), 404

    # The pay-and-download flow (PayPage -> SuccessPage) never requires login —
    # a tenant can pay via a shared link without an account. The payment's own
    # unpredictable confirmation code, known only to whoever just completed
    # that payment, stands in for login on this one download right afterward.
    code = request.args.get('code')
    if code and code == payment['mpesa_code']:
        pass
    elif 'user_id' not in session:
        conn.close()
        return jsonify({'error': 'you are not logged in'}), 401
    elif session['role'] == 'agent':
        from routes.tenant import agent_can_access_tenant
        tenant = conn.execute('SELECT * FROM users WHERE user_id = ?', (payment['tenant_id'],)).fetchone()
        if not tenant or not agent_can_access_tenant(conn, tenant):
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403
    elif session['role'] not in ('admin', 'landlord') and session['user_id'] != payment['tenant_id']:
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    allocations = conn.execute('''
        SELECT pa.amount, i.invoice_id, i.month, i.status
        FROM payment_allocations pa
        JOIN invoices i ON pa.invoice_id = i.invoice_id
        WHERE pa.payment_id = ?
        ORDER BY i.due_date ASC
    ''', (payment_id,)).fetchall()
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"{payment['property_name']} — Payment Receipt", styles['Title']))
    elements.append(Spacer(1, 16))

    receipt_data = [
        ['Receipt No', f"RCT-{payment['payment_id']:05d}"],
        ['Tenant', payment['tenant_name']],
        ['House', f"House {payment['unit_number']}"],
        ['Amount Paid', f"Ksh {payment['amount']:,.0f}"],
        ['Payment Date', payment['payment_date']],
        ['M-Pesa Code', payment['mpesa_code'] or '—'],
        ['Phone Used', payment['phone_used']],
        ['Status', payment['status'].upper()],
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

    elements.append(Paragraph("Invoices Covered", styles['Heading2']))
    if allocations:
        invoice_rows = [['Invoice No', 'Month', 'Amount Applied', 'Invoice Status']]
        for a in allocations:
            invoice_rows.append([
                f"INV-{a['invoice_id']:05d}",
                a['month'],
                f"Ksh {a['amount']:,.0f}",
                a['status'].upper(),
            ])
        invoice_table = Table(invoice_rows, colWidths=[100, 130, 110, 90])
        invoice_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f5ee')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(invoice_table)
    else:
        elements.append(Paragraph("No invoice on record for this payment.", styles['Normal']))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Thank you for your payment.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"receipt-RCT-{payment['payment_id']:05d}.pdf"
    )