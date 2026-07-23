from flask import Blueprint, request, jsonify
from database import get_db
from routes.decorators import login_required, role_required

properties_bp = Blueprint('properties', __name__)


@properties_bp.route('/api/properties', methods=['GET'])
def get_properties():
    conn = get_db()
    properties = conn.execute('SELECT * FROM properties').fetchall()
    conn.close()

    return jsonify([dict(p) for p in properties]), 200


@properties_bp.route('/api/properties/<int:property_id>', methods=['GET'])
@login_required
def get_property(property_id):
    conn = get_db()
    prop = conn.execute(
        'SELECT * FROM properties WHERE property_id = ?', (property_id,)
    ).fetchone()
    conn.close()

    if not prop:
        return jsonify({'error': 'Property not found'}), 404

    return jsonify(dict(prop)), 200


@properties_bp.route('/api/properties', methods=['POST'])
@role_required('admin', 'landlord')
def create_property():
    data = request.get_json(silent=True) or {}

    name = data.get('name')
    location = data.get('location')
    paybill_no = data.get('paybill_no')
    account_no = data.get('account_no')

    if not all([name, location, account_no]):
        return jsonify({'error': 'name, location, and account_no are required'}), 400

    conn = get_db()
    cursor = conn.execute('''
        INSERT INTO properties (name, location, paybill_no, account_no, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    ''', (name, location, paybill_no, account_no))

    new_property_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Property created successfully',
        'property_id': new_property_id
    }), 201


@properties_bp.route('/api/properties/<int:property_id>/units', methods=['POST'])
@role_required('admin', 'landlord')
def add_unit(property_id):
    conn = get_db()

    prop = conn.execute(
        'SELECT * FROM properties WHERE property_id = ?', (property_id,)
    ).fetchone()

    if not prop:
        conn.close()
        return jsonify({'error': 'Property not found'}), 404

    data = request.get_json(silent=True) or {}

    unit_number = data.get('unit_number')
    rent_amount = data.get('rent_amount')
    payment_type = data.get('payment_type')

    if not all([unit_number, rent_amount, payment_type]):
        conn.close()
        return jsonify({'error': 'unit_number, rent_amount, and payment_type are required'}), 400

    phone_no = data.get('phone_no')
    has_water_bill = data.get('has_water_bill', 0)
    water_bill = data.get('water_bill', 0)
    penalty_date = data.get('penalty_date', 5)
    penalty_rate = data.get('penalty_rate', 5.0)

    cursor = conn.execute('''
        INSERT INTO units
        (property_id, unit_number, rent_amount, payment_type, phone_no,
         has_water_bill, water_bill, penalty_date, penalty_rate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
    ''', (property_id, unit_number, rent_amount, payment_type, phone_no,
          has_water_bill, water_bill, penalty_date, penalty_rate))

    new_unit_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Unit added successfully',
        'unit_id': new_unit_id
    }), 201
@properties_bp.route('/api/properties/<int:property_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_property(property_id):
    conn = get_db()

    prop = conn.execute('SELECT * FROM properties WHERE property_id = ?', (property_id,)).fetchone()
    if not prop:
        conn.close()
        return jsonify({'error': 'Property not found'}), 404

    unit_count = conn.execute(
        'SELECT COUNT(*) FROM units WHERE property_id = ?', (property_id,)
    ).fetchone()[0]

    if unit_count > 0:
        conn.close()
        return jsonify({'error': f'Cannot delete: this property still has {unit_count} unit(s). Remove all units first.'}), 400

    conn.execute('DELETE FROM properties WHERE property_id = ?', (property_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Property deleted successfully'}), 200