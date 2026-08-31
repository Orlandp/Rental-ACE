from flask import Blueprint, session, request, jsonify
from database import get_db
from routes.decorators import login_required, role_required

units_bp = Blueprint('units', __name__)

@units_bp.route('/api/units', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def get_units():
    conn = get_db()

    if session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        property_id = agent['assigned_property_id'] if agent else None
        units = conn.execute(
            'SELECT * FROM units WHERE property_id = ?', (property_id,)
        ).fetchall() if property_id else []
    else:
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
    paybill_no = data.get('paybill_no', unit['paybill_no'])
    account_no = data.get('account_no', unit['account_no'])

    conn.execute('''
        UPDATE units
        SET rent_amount = ?, payment_type = ?, phone_no = ?, has_water_bill = ?,
            water_bill = ?, penalty_date = ?, penalty_rate = ?, status = ?,
            paybill_no = ?, account_no = ?
        WHERE unit_id = ?
    ''', (rent_amount, payment_type, phone_no, has_water_bill,
          water_bill, penalty_date, penalty_rate, status,
          paybill_no, account_no, unit_id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Unit updated successfully'}), 200

@units_bp.route('/api/units/<int:unit_id>/public', methods=['GET'])
def get_unit_public(unit_id):
    conn = get_db()
    unit = conn.execute('''
        SELECT u.unit_id, u.unit_number, u.rent_amount, u.payment_type,
               u.phone_no, u.has_water_bill, u.water_bill, u.property_id,
               p.name AS property_name,
               COALESCE(u.paybill_no, p.paybill_no) AS paybill_no,
               COALESCE(u.account_no, p.account_no) AS account_no
        FROM units u
        JOIN properties p ON u.property_id = p.property_id
        WHERE u.unit_id = ?
    ''', (unit_id,)).fetchone()

    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    invoice = conn.execute('''
        SELECT * FROM invoices
        WHERE unit_id = ? AND status IN ('unpaid', 'partial')
        ORDER BY due_date ASC, invoice_id ASC LIMIT 1
    ''', (unit_id,)).fetchone()

    if invoice:
        from datetime import datetime
        from routes.invoices import refresh_invoice_penalty
        penalty, total_amount = refresh_invoice_penalty(conn, invoice, datetime.now())
        conn.commit()
    conn.close()

    unit_data = dict(unit)

    if invoice:
        balance_due = total_amount - invoice['amount_paid']
        unit_data.update({
            'has_invoice': True,
            'invoice_id': invoice['invoice_id'],
            'invoice_no': f"INV-{invoice['invoice_id']:05d}",
            'current_month': invoice['month'],
            'penalty': penalty,
            'amount_paid': invoice['amount_paid'],
            'total_due': balance_due,
            'invoice_status': invoice['status'],
            'already_paid_this_month': False,
        })
    else:
        unit_data.update({
            'has_invoice': False,
            'total_due': 0,
            'penalty': 0,
            'already_paid_this_month': True,
        })

    return jsonify(unit_data), 200
@units_bp.route('/api/units/<int:unit_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_unit(unit_id):
    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    active_tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()

    if active_tenant:
        conn.close()
        return jsonify({'error': f"Cannot delete: {active_tenant['full_name']} is still an active tenant in this unit"}), 400

    conn.execute('DELETE FROM units WHERE unit_id = ?', (unit_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Unit deleted successfully'}), 200
