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

    from datetime import datetime
    now = datetime.now()
    payment_date = now.strftime('%Y-%m-%d')
    month = now.strftime('%B %Y')

    penalty = calculate_penalty(unit['rent_amount'], payment_date)
    amount = unit['rent_amount'] + penalty

    import random
    mpesa_code = 'SIM' + ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=8))

    cursor = conn.execute('''
        INSERT INTO payments
        (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')
    ''', (tenant['user_id'], unit_id, amount, mpesa_code, phone_used, payment_date, month))

    payment_id = cursor.lastrowid

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, datetime('now'), 'sent')
    ''', (
        tenant['phone'],
        f"Dear {tenant['full_name']}, we have received your rent payment of Ksh {amount:,.0f} for House {unit['unit_number']}. Thank you!"
    ))

    conn.execute('''
        UPDATE invoices SET status = 'paid', payment_id = ?, paid_at = ?
        WHERE unit_id = ? AND month = ? AND status = 'unpaid'
    ''', (payment_id, payment_date, unit_id, month))

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
        'mpesa_code': mpesa_code,
        'payment_date': payment_date,
        'month': month
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
@role_required('admin', 'landlord')
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

    tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()

    if not tenant:
        conn.close()
        return jsonify({'error': 'No active tenant found for this unit'}), 404

    cursor = conn.execute('''
        INSERT INTO payments
        (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')
    ''', (tenant['user_id'], unit_id, amount, mpesa_code, phone_used, payment_date, month))

    payment_id = cursor.lastrowid

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, datetime('now'), 'sent')
    ''', (
        tenant['phone'],
        f"Dear {tenant['full_name']}, we have recorded a payment of Ksh {amount:,.0f} for House {unit['unit_number']} ({month}). Thank you!"
    ))

    conn.execute('''
        UPDATE invoices SET status = 'paid', payment_id = ?, paid_at = ?
        WHERE unit_id = ? AND month = ? AND status = 'unpaid'
    ''', (payment_id, payment_date, unit_id, month))

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Manual payment recorded successfully',
        'payment_id': payment_id,
    }), 201


@payments_bp.route('/api/payments/<int:payment_id>/receipt/pdf', methods=['GET'])
def download_receipt_pdf(payment_id):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_db()
    payment = conn.execute('''
        SELECT p.*, u.full_name AS tenant_name, un.unit_number, un.rent_amount AS unit_rent_amount,
               pr.name AS property_name
        FROM payments p
        JOIN users u ON p.tenant_id = u.user_id
        JOIN units un ON p.unit_id = un.unit_id
        JOIN properties pr ON un.property_id = pr.property_id
        WHERE p.payment_id = ?
    ''', (payment_id,)).fetchone()
    conn.close()

    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    rent_amount = min(payment['unit_rent_amount'], payment['amount'])
    penalty = max(payment['amount'] - rent_amount, 0)

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
        ['Month', payment['month']],
        ['Rent Amount', f"Ksh {rent_amount:,.0f}"],
        ['Penalty', f"Ksh {penalty:,.0f}"],
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
    elements.append(Paragraph("Thank you for your payment.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"receipt-RCT-{payment['payment_id']:05d}.pdf"
    )