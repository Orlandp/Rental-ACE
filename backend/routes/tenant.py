from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

tenants_bp = Blueprint('tenants', __name__)


@tenants_bp.route('/api/tenants', methods=['GET'])
@role_required('admin', 'landlord')
def get_tenants():
    conn = get_db()
    tenants = conn.execute('''
        SELECT u.user_id, u.full_name, u.username, u.phone, u.id_number, u.role, u.unit_id, u.status, u.created_at,
               u.agreement_signed, u.agreement_signed_at, u.deposit_paid, u.deposit_paid_at, u.deposit_amount_paid,
               u.id_photo_path, u.id_photo_verified, u.id_photo_verified_at, u.id_photo_requested,
               un.deposit_amount AS unit_deposit_amount
        FROM users u
        LEFT JOIN units un ON u.unit_id = un.unit_id
        WHERE u.role = 'tenant'
    ''').fetchall()
    conn.close()

    return jsonify([dict(t) for t in tenants]), 200


@tenants_bp.route('/api/tenants/pending', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def get_pending_tenants():
    conn = get_db()

    if session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        property_id = agent['assigned_property_id'] if agent else None
        pending = conn.execute('''
            SELECT u.user_id, u.full_name, u.username, u.phone, u.id_number, u.unit_id, u.created_at
            FROM users u
            JOIN units un ON u.unit_id = un.unit_id
            WHERE u.role = 'tenant' AND u.status = 'pending' AND un.property_id = ?
        ''', (property_id,)).fetchall() if property_id else []
    else:
        pending = conn.execute(
            "SELECT user_id, full_name, username, phone, id_number, unit_id, created_at FROM users WHERE role = 'tenant' AND status = 'pending'"
        ).fetchall()

    conn.close()

    return jsonify([dict(p) for p in pending]), 200


@tenants_bp.route('/api/tenants/<int:user_id>/approve', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def approve_tenants(user_id):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Tenant already active'}), 400

    data = request.get_json(silent=True) or {}
    unit_id = data.get('unit_id', user['unit_id'])

    if session['role'] == 'agent' and unit_id != user['unit_id']:
        # agent is reassigning the unit at approval time — the new unit must
        # still fall within their own assigned property
        new_unit = conn.execute('SELECT property_id FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        if not new_unit or not agent or new_unit['property_id'] != agent['assigned_property_id']:
            conn.close()
            return jsonify({'error': 'That unit is not in your assigned property'}), 403

    conn.execute(
        "UPDATE users SET status = 'active', unit_id = ? WHERE user_id = ?",
        (unit_id, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({'message': f"Tenant {user['full_name']} approved successfully"}), 200


@tenants_bp.route('/api/tenants/<int:user_id>/reject', methods=['DELETE'])
@role_required('admin', 'landlord', 'agent')
def reject_user(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if user['status'] != 'pending':
        conn.close()
        return jsonify({'error': 'Only pending applicants can be rejected'}), 400

    # soft delete: keep the row (and any history tied to it) instead of
    # hard-deleting, so a reject never orphans payments/invoices/messages
    conn.execute("UPDATE users SET status = 'rejected' WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': f"Applicant {user['full_name']} rejected"}), 200


def _compute_vacate_balance(conn, user, now):
    """Void a tenant's outstanding invoices and net their balance against the
    deposit paid, returning a breakdown. Does not touch users/units status."""
    from routes.invoices import refresh_invoice_penalty, format_invoice_no

    outstanding = conn.execute(
        "SELECT * FROM invoices WHERE tenant_id = ? AND status IN ('unpaid', 'partial') ORDER BY due_date ASC",
        (user['user_id'],)
    ).fetchall()

    invoice_list = []
    total_owed = 0
    for inv in outstanding:
        penalty, total_amount = refresh_invoice_penalty(conn, inv, now)
        balance = total_amount - inv['amount_paid']
        total_owed += balance
        invoice_list.append({
            'invoice_no': format_invoice_no(inv['invoice_id']),
            'month': inv['month'],
            'balance_due': balance,
        })

    deposit_paid = user['deposit_amount_paid'] or 0
    refund_amount = deposit_paid - total_owed

    return {
        'deposit_paid': deposit_paid,
        'outstanding_owed': total_owed,
        'outstanding_invoices': invoice_list,
        'refund_amount': refund_amount,
    }


@tenants_bp.route('/api/tenants/<int:user_id>/vacate-preview', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def vacate_preview(user_id):
    from datetime import datetime

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if user['status'] != 'active':
        conn.close()
        return jsonify({'error': 'Only active tenants can be vacated'}), 400

    breakdown = _compute_vacate_balance(conn, user, datetime.now())
    conn.commit()
    conn.close()

    return jsonify({
        'tenant_name': user['full_name'],
        **breakdown,
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/vacate', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def vacate_tenant(user_id):
    import os
    import json
    from datetime import datetime
    from werkzeug.utils import secure_filename

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if user['status'] != 'active':
        conn.close()
        return jsonify({'error': 'Only active tenants can be vacated'}), 400

    old_unit_id = user['unit_id']
    now = datetime.now()
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')

    breakdown = _compute_vacate_balance(conn, user, now)

    # optional damage/other deposit deductions, sent as a JSON string field
    # alongside up to 3 evidence photos in the same multipart form submission
    raw_deductions = request.form.get('deductions')
    deductions = []
    if raw_deductions:
        try:
            deductions = json.loads(raw_deductions)
        except (ValueError, TypeError):
            deductions = []

    total_deductions = 0
    for d in deductions:
        reason = (d.get('reason') or '').strip()
        try:
            amount = float(d.get('amount'))
        except (TypeError, ValueError):
            continue
        if not reason or amount <= 0:
            continue
        total_deductions += amount
        conn.execute('''
            INSERT INTO deposit_deductions (tenant_id, reason, amount, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, reason, amount, now_str))

    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads', 'vacate_evidence')
    os.makedirs(upload_dir, exist_ok=True)

    for field in ('photo1', 'photo2', 'photo3'):
        file = request.files.get(field)
        if file and file.filename:
            safe_name = secure_filename(file.filename)
            stored_name = f"tenant{user_id}_{int(now.timestamp())}_{field}_{safe_name}"
            file.save(os.path.join(upload_dir, stored_name))
            conn.execute('''
                INSERT INTO vacate_evidence_photos (tenant_id, file_path, created_at)
                VALUES (?, ?, ?)
            ''', (user_id, f"/uploads/vacate_evidence/{stored_name}", now_str))

    breakdown['damage_deductions'] = total_deductions
    breakdown['refund_amount'] -= total_deductions

    conn.execute(
        "UPDATE invoices SET status = 'void' WHERE tenant_id = ? AND status IN ('unpaid', 'partial')",
        (user_id,)
    )

    conn.execute(
        "UPDATE users SET status = 'vacated', vacated_at = ? WHERE user_id = ?",
        (now_str, user_id)
    )

    if old_unit_id:
        conn.execute(
            "UPDATE units SET status = 'AVAILABLE' WHERE unit_id = ?",
            (old_unit_id,)
        )

    conn.commit()
    conn.close()

    return jsonify({
        'message': f"{user['full_name']} has been vacated",
        **breakdown,
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/unvacate', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def unvacate_tenant(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if user['status'] != 'vacated':
        conn.close()
        return jsonify({'error': 'Only vacated tenants can be restored'}), 400

    data = request.get_json(silent=True) or {}
    # tenants vacated before unit_id was preserved on vacate have none on record,
    # so admin must supply which unit to restore them into
    target_unit_id = user['unit_id'] or data.get('unit_id')

    if not target_unit_id:
        conn.close()
        return jsonify({'error': 'This tenant has no unit on record. Please choose a unit to restore them into.'}), 400

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (target_unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'That unit does not exist.'}), 404

    if session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        if not agent or unit['property_id'] != agent['assigned_property_id']:
            conn.close()
            return jsonify({'error': 'That unit is not in your assigned property'}), 403

    other_active = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active' AND user_id != ?",
        (target_unit_id, user_id)
    ).fetchone()
    if other_active:
        conn.close()
        return jsonify({
            'error': f"House {unit['unit_number']} is occupied by {other_active['full_name']}. "
                     f"Please choose a different unit."
        }), 400

    conn.execute("UPDATE users SET status = 'active', unit_id = ? WHERE user_id = ?", (target_unit_id, user_id))
    conn.execute("UPDATE units SET status = 'OCCUPIED' WHERE unit_id = ?", (target_unit_id,))

    conn.execute('''
        UPDATE invoices
        SET status = CASE
            WHEN amount_paid <= 0 THEN 'unpaid'
            WHEN amount_paid < total_amount THEN 'partial'
            ELSE 'paid'
        END
        WHERE tenant_id = ? AND status = 'void'
    ''', (user_id,))

    conn.commit()
    conn.close()

    return jsonify({
        'message': f"{user['full_name']} has been restored to House {unit['unit_number']}"
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/deductions', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def get_tenant_deductions(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    deductions = conn.execute(
        'SELECT * FROM deposit_deductions WHERE tenant_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    photos = conn.execute(
        'SELECT * FROM vacate_evidence_photos WHERE tenant_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()

    return jsonify({
        'deductions': [dict(d) for d in deductions],
        'photos': [dict(p) for p in photos],
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/vacate-receipt/pdf', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def download_vacate_receipt(user_id):
    from flask import send_file
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_db()

    tenant = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()
    if not tenant:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, tenant):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if tenant['status'] != 'vacated':
        conn.close()
        return jsonify({'error': 'This tenant has not been vacated.'}), 400

    voided_invoices = conn.execute(
        "SELECT * FROM invoices WHERE tenant_id = ? AND status = 'void' ORDER BY due_date ASC",
        (user_id,)
    ).fetchall()
    deductions = conn.execute(
        'SELECT * FROM deposit_deductions WHERE tenant_id = ? ORDER BY created_at ASC',
        (user_id,)
    ).fetchall()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (tenant['unit_id'],)).fetchone()
    prop = conn.execute(
        'SELECT * FROM properties WHERE property_id = ?', (unit['property_id'],)
    ).fetchone() if unit else None
    conn.close()

    from routes.invoices import format_invoice_no

    outstanding_owed = sum(inv['total_amount'] - inv['amount_paid'] for inv in voided_invoices)
    total_deductions = sum(d['amount'] for d in deductions)
    deposit_paid = tenant['deposit_amount_paid'] or 0
    refund_amount = deposit_paid - outstanding_owed - total_deductions

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    property_name = prop['name'] if prop else 'Ace Apartments'
    elements.append(Paragraph(f"{property_name} — Vacate Settlement Receipt", styles['Title']))
    elements.append(Spacer(1, 16))

    header_data = [
        ['Receipt No', f"VAC-{user_id:05d}"],
        ['Tenant', tenant['full_name']],
        ['House', f"House {unit['unit_number']}" if unit else '—'],
        ['Vacated On', (tenant['vacated_at'] and tenant['vacated_at'][:10]) or '—'],
    ]
    header_table = Table(header_data, colWidths=[160, 240])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5ee')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Outstanding Rent (voided on vacate)", styles['Heading2']))
    if voided_invoices:
        rent_rows = [['Invoice No', 'Month', 'Balance']]
        for inv in voided_invoices:
            rent_rows.append([
                format_invoice_no(inv['invoice_id']),
                inv['month'],
                f"Ksh {(inv['total_amount'] - inv['amount_paid']):,.0f}",
            ])
        rent_table = Table(rent_rows, colWidths=[130, 180, 90])
        rent_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fdecea')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(rent_table)
    else:
        elements.append(Paragraph("No outstanding rent at time of vacating.", styles['Normal']))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Deposit Deductions", styles['Heading2']))
    if deductions:
        ded_rows = [['Reason', 'Amount']]
        for d in deductions:
            ded_rows.append([d['reason'], f"Ksh {d['amount']:,.0f}"])
        ded_table = Table(ded_rows, colWidths=[310, 90])
        ded_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fdecea')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(ded_table)
    else:
        elements.append(Paragraph("No deductions recorded.", styles['Normal']))
    elements.append(Spacer(1, 24))

    summary_data = [
        ['Deposit Paid', f"Ksh {deposit_paid:,.0f}"],
        ['Less: Outstanding Rent', f"Ksh {outstanding_owed:,.0f}"],
        ['Less: Deductions', f"Ksh {total_deductions:,.0f}"],
        [
            'Refund Due to Tenant' if refund_amount >= 0 else 'Amount Still Owed by Tenant',
            f"Ksh {abs(refund_amount):,.0f}",
        ],
    ]
    summary_table = Table(summary_data, colWidths=[250, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -2), colors.HexColor('#f4f6f8')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1a7a4a') if refund_amount >= 0 else colors.HexColor('#c0392b')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"vacate-settlement-VAC-{user_id:05d}.pdf"
    )


def agent_can_access_tenant(conn, user):
    """True if the logged-in agent's assigned property matches this tenant's unit."""
    if session['role'] != 'agent':
        return True

    agent = conn.execute(
        'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
    ).fetchone()

    if not agent or not agent['assigned_property_id'] or not user['unit_id']:
        return False

    unit = conn.execute(
        'SELECT property_id FROM units WHERE unit_id = ?', (user['unit_id'],)
    ).fetchone()

    return bool(unit) and unit['property_id'] == agent['assigned_property_id']


@tenants_bp.route('/api/tenants/<int:user_id>/deposit', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def mark_deposit_paid(user_id):
    from datetime import datetime

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    data = request.get_json(silent=True) or {}
    amount_paid = data.get('amount_paid')

    if amount_paid is None:
        conn.close()
        return jsonify({'error': 'amount_paid is required'}), 400

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        UPDATE users SET deposit_paid = 1, deposit_paid_at = ?, deposit_amount_paid = ?
        WHERE user_id = ?
    ''', (now, amount_paid, user_id))

    conn.commit()
    conn.close()

    return jsonify({
        'message': f"Deposit recorded for {user['full_name']}",
        'deposit_paid_at': now,
        'deposit_amount_paid': amount_paid,
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/verify-id', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def verify_tenant_id(user_id):
    from datetime import datetime

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if not user['id_photo_path']:
        conn.close()
        return jsonify({'error': 'This tenant has no ID photo on file yet.'}), 400

    now_dt = datetime.now()
    now = now_dt.strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        UPDATE users SET id_photo_verified = 1, id_photo_verified_at = ?, id_photo_requested = 0
        WHERE user_id = ?
    ''', (now, user_id))

    first_invoice = None
    if user['unit_id']:
        unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (user['unit_id'],)).fetchone()
        if unit:
            from routes.invoices import generate_first_invoice_for_tenant
            first_invoice = generate_first_invoice_for_tenant(conn, user, unit, now_dt)

    conn.commit()
    conn.close()

    return jsonify({
        'message': f"Contract approved for {user['full_name']}",
        'id_photo_verified_at': now,
        'first_invoice': first_invoice,
    }), 200


@tenants_bp.route('/api/tenants/<int:user_id>/request-id', methods=['PUT'])
@role_required('admin', 'landlord', 'agent')
def request_tenant_id(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if not agent_can_access_tenant(conn, user):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    conn.execute('''
        UPDATE users SET id_photo_requested = 1, id_photo_verified = 0
        WHERE user_id = ?
    ''', (user_id,))

    conn.commit()
    conn.close()

    return jsonify({'message': f"{user['full_name']} will be asked to submit their ID/passport photo on next login"}), 200


@tenants_bp.route('/api/tenants/<int:user_id>/deposit-receipt/pdf', methods=['GET'])
@login_required
def download_deposit_receipt(user_id):
    from flask import send_file
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    if session['role'] not in ('admin', 'landlord', 'agent') and session['user_id'] != user_id:
        return jsonify({'error': 'Forbidden'}), 403

    conn = get_db()

    tenant = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()
    if not tenant:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if session['role'] == 'agent' and not agent_can_access_tenant(conn, tenant):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if not tenant['deposit_paid']:
        conn.close()
        return jsonify({'error': 'No deposit has been recorded for this tenant yet.'}), 400

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (tenant['unit_id'],)).fetchone()
    prop = conn.execute(
        'SELECT * FROM properties WHERE property_id = ?', (unit['property_id'],)
    ).fetchone() if unit else None
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    property_name = prop['name'] if prop else 'Ace Apartments'
    elements.append(Paragraph(f"{property_name} — Deposit Receipt", styles['Title']))
    elements.append(Spacer(1, 16))

    receipt_data = [
        ['Receipt No', f"DEP-{user_id:05d}"],
        ['Tenant', tenant['full_name']],
        ['House', f"House {unit['unit_number']}" if unit else '—'],
        ['Deposit Amount Paid', f"Ksh {tenant['deposit_amount_paid']:,.0f}"],
        ['Date Paid', tenant['deposit_paid_at'] or '—'],
        ['Status', 'PAID'],
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
    elements.append(Paragraph(
        "This deposit is refundable at the end of tenancy, less any deductions for damages "
        "or outstanding rent, per the signed Tenancy Agreement.",
        styles['Normal']
    ))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"deposit-receipt-DEP-{user_id:05d}.pdf"
    )


@tenants_bp.route('/api/tenants/me/summary', methods=['GET'])
@role_required('tenant')
def my_summary():
    from datetime import datetime

    conn = get_db()

    user = conn.execute(
        'SELECT * FROM users WHERE user_id = ?', (session['user_id'],)
    ).fetchone()

    unit = conn.execute(
        'SELECT * FROM units WHERE unit_id = ?', (user['unit_id'],)
    ).fetchone()

    prop = conn.execute(
        'SELECT * FROM properties WHERE property_id = ?', (unit['property_id'],)
    ).fetchone()

    invoice = conn.execute('''
        SELECT * FROM invoices
        WHERE unit_id = ? AND status IN ('unpaid', 'partial')
        ORDER BY due_date ASC, invoice_id ASC LIMIT 1
    ''', (unit['unit_id'],)).fetchone()

    if invoice:
        from routes.invoices import refresh_invoice_penalty
        penalty, total_amount = refresh_invoice_penalty(conn, invoice, datetime.now())
        conn.commit()
    conn.close()

    if invoice:
        current_month = invoice['month']
        total_due = total_amount - invoice['amount_paid']
        already_paid_this_month = False
        invoice_status = invoice['status']
        amount_paid_on_invoice = invoice['amount_paid']
    else:
        current_month = datetime.now().strftime('%B %Y')
        penalty = 0
        total_due = 0
        already_paid_this_month = True
        invoice_status = None
        amount_paid_on_invoice = 0

    return jsonify({
        'user_id': user['user_id'],
        'full_name': user['full_name'],
        'phone': user['phone'],
        'unit_number': unit['unit_number'],
        'rent_amount': unit['rent_amount'],
        'has_water_bill': unit['has_water_bill'],
        'water_bill': unit['water_bill'],
        'property_name': prop['name'],
        'location': prop['location'],
        'current_month': current_month,
        'already_paid_this_month': already_paid_this_month,
        'has_invoice': invoice is not None,
        'invoice_status': invoice_status,
        'amount_paid_on_invoice': amount_paid_on_invoice,
        'penalty': penalty,
        'total_due': total_due,
        'agreement_signed': bool(user['agreement_signed']),
        'id_photo_requested': bool(user['id_photo_requested']),
        'deposit_paid': bool(user['deposit_paid']),
    }), 200