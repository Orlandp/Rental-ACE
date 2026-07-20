from flask import Blueprint, request, jsonify , session
from database import get_db
from routes.decorators import login_required

payments_bp = Blueprint('payments', __name__)

def calculate_penalty(rent_amount, payment_date_str):
    day = int(payment_date_str.split('-')[2])
    if day <= 5:
        return 0
    elif day <= 10:
        return rent_amount * 0.10
    else :
       return rent_amount * 0.10

@payments_bp.route('/api/payments', methods=['POST'])
@login_required
def create_payment():
    data = request.get_json (silent=True) or {}

    unit_id = data.get('unit_id')
    amount = data.get('amount')
    mpesa_code = data.get('mpesa_code')
    month = data.get('month')
    payment_date = data.get('payment_date')
    phone_used = data.get('phone_used')

    if not all ([unit_id, amount, mpesa_code, month, payment_date, phone_used]):
        return jsonify({'error': 'not a match'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units where unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error':'No unit found'}), 404
    
    tenant_id = session.get('user_id')

    penalty = calculate_penalty(unit['rent_amount'], payment_date)
    total_expected = unit['rent_amount'] + penalty

    cursor = conn.execute('''
        INSERT INTO payments
        (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'paid')
    ''', (tenant_id, unit_id, amount, mpesa_code, phone_used, payment_date, month))

    payment_id = cursor.lastrowid
    conn.commit ()
    conn.close()

    receipt = {
        'receipt_no': f'RCT-{payment_id:05d}',
        'payment_id': payment_id,
        'unit_number': unit['unit_number'],
        'rent_amount': unit['rent_amount'],
        'penalty': penalty,
        'total_expected': total_expected,
        'amount_paid': amount,
        'mpesa_code': mpesa_code,
        'payment_date': payment_date,
        'month': month
    }

    return jsonify({
        'message': 'Payment recorded successfully',
        'receipt': receipt
    }), 201


