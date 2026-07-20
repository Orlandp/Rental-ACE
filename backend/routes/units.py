from flask import Blueprint, session, request, jsonify
from database import get_db
from routes.decorators import login_required, role_required

units_bp = Blueprint('units', __name__)

@units_bp.route('/api/units', methods=['GET'])
@role_required('admin', 'landlord')
def get_units():
    conn = get_db()
    units = conn.execute('SELECT * FROM units').fetchall()
    conn.close()

    return jsonify([dict(u) for u in units]), 200

@units_bp.route('/api/units/<int:unit_id>', methods=['GET'])
@login_required
def get_unit(unit_id):
    conn = get_db()

    if session['role'] not in ('admin', 'landlord'):
        user = conn.execute(
            'SELECT unit_id from users WHERE user_id=?', (session['user_id'],)
        ).fetchone()

        if not user or user['unit_id'] != unit_id:
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    conn.close()

    if not unit:
        return jsonify({'error': 'Unit not found'}), 404

    return jsonify(dict(unit)), 200

@units_bp.route('/api/units/<int:unit_id>', methods=['PUT'])
@role_required('admin', 'landlord')
def update_unit(unit_id):
    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    data = request.get_json()

    rent_amount = data.get('rent_amount', unit['rent_amount'])
    payment_type = data.get('payment_type', unit['payment_type'])
    phone_no = data.get('phone_no', unit['phone_no'])
    has_water_bill = data.get('has_water_bill', unit['has_water_bill'])
    water_bill = data.get('water_bill', unit['water_bill'])
    penalty_date = data.get('penalty_date', unit['penalty_date'])
    penalty_rate = data.get('penalty_rate', unit['penalty_rate'])
    status = data.get('status', unit['status'])

    conn.execute('''
        UPDATE units
        SET rent_amount = ?, payment_type = ?, phone_no = ?, has_water_bill = ?,
            water_bill = ?, penalty_date = ?, penalty_rate = ?, status = ?
        WHERE unit_id = ?
    ''', (rent_amount, payment_type, phone_no, has_water_bill,
          water_bill, penalty_date, penalty_rate, status, unit_id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Unit updated successfully'}), 200
