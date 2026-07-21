from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required

payments_bp = Blueprint('payments', __name__)


def calculate_penalty(rent_amount, payment_date_str):
    day = int(payment_date_str.split('-')[2])
    if day <= 5:
        return 0
    elif day <= 10:
        return rent_amount * 0.05
    else:
        return rent_amount * 0.10


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