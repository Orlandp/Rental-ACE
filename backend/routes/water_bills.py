from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

water_bills_bp = Blueprint('water_bills', __name__)


@water_bills_bp.route('/api/water-bills', methods=['POST'])
@role_required('admin', 'landlord')
def set_water_bill():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    amount = data.get('amount')
    month = data.get('month')
    year = data.get('year')

    if not all([unit_id, amount, month, year]):
        return jsonify({'error': 'unit_id, amount, month, and year are required'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()

    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    if not unit['has_water_bill']:
        conn.close()
        return jsonify({'error': 'This unit does not have water billing'}), 400

    cursor = conn.execute('''
        INSERT INTO water_bills (unit_id, amount, month, year)
        VALUES (?, ?, ?, ?)
    ''', (unit_id, amount, month, year))

    bill_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Water bill recorded successfully',
        'bill_id': bill_id
    }), 201


@water_bills_bp.route('/api/water-bills/<int:unit_id>', methods=['GET'])
@login_required
def get_water_bill_history(unit_id):
    conn = get_db()

    if session['role'] not in ('admin', 'landlord'):
        user = conn.execute(
            'SELECT unit_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()

        if not user or user['unit_id'] != unit_id:
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403

    bills = conn.execute(
        'SELECT * FROM water_bills WHERE unit_id = ? ORDER BY year DESC, month DESC',
        (unit_id,)
    ).fetchall()
    conn.close()

    return jsonify([dict(b) for b in bills]), 200


@water_bills_bp.route('/api/water-bills/<int:bill_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_water_bill(bill_id):
    conn = get_db()

    bill = conn.execute('SELECT * FROM water_bills WHERE bill_id = ?', (bill_id,)).fetchone()
    if not bill:
        conn.close()
        return jsonify({'error': 'Water bill entry not found'}), 404

    conn.execute('DELETE FROM water_bills WHERE bill_id = ?', (bill_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Water bill entry deleted successfully'}), 200
