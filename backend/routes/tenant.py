from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

tenants_bp = Blueprint('tenants', __name__)


@tenants_bp.route('/api/tenants', methods=['GET'])
@role_required('admin', 'landlord')
def get_tenants():
    conn = get_db()
    tenants = conn.execute('''
        SELECT user_id, full_name, username, phone, id_number, role, unit_id, status, created_at,
               agreement_signed, agreement_signed_at, deposit_paid, deposit_paid_at, deposit_amount_paid
        FROM users WHERE role = 'tenant'
    ''').fetchall()
    conn.close()

    return jsonify([dict(t) for t in tenants]), 200


@tenants_bp.route('/api/tenants/pending', methods=['GET'])
@role_required('admin', 'landlord')
def get_pending_tenants():
    conn = get_db()
    pending = conn.execute(
        "SELECT user_id, full_name, username, phone, id_number, unit_id, created_at FROM users WHERE role = 'tenant' AND status = 'pending'"
    ).fetchall()
    conn.close()

    return jsonify([dict(p) for p in pending]), 200


@tenants_bp.route('/api/tenants/<int:user_id>/approve', methods=['PUT'])
@role_required('admin', 'landlord')
def approve_tenants(user_id):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Tenant already active'}), 400

    data = request.get_json(silent=True) or {}
    unit_id = data.get('unit_id', user['unit_id'])

    conn.execute(
        "UPDATE users SET status = 'active', unit_id = ? WHERE user_id = ?",
        (unit_id, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({'message': f"Tenant {user['full_name']} approved successfully"}), 200


@tenants_bp.route('/api/tenants/<int:user_id>/reject', methods=['DELETE'])
@role_required('admin', 'landlord')
def reject_user(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Already an active user'}), 400

    conn.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': f"Applicant {user['full_name']} rejected"}), 200


@tenants_bp.route('/api/tenants/<int:user_id>/vacate', methods=['PUT'])
@role_required('admin', 'landlord')
def vacate_tenant(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

    if user['status'] != 'active':
        conn.close()
        return jsonify({'error': 'Only active tenants can be vacated'}), 400

    old_unit_id = user['unit_id']

    conn.execute(
        "UPDATE users SET status = 'vacated', unit_id = NULL WHERE user_id = ?",
        (user_id,)
    )

    if old_unit_id:
        conn.execute(
            "UPDATE units SET status = 'AVAILABLE' WHERE unit_id = ?",
            (old_unit_id,)
        )

    conn.commit()
    conn.close()

    return jsonify({'message': f"{user['full_name']} has been vacated"}), 200

@tenants_bp.route('/api/tenants/<int:user_id>/deposit', methods=['PUT'])
@role_required('admin', 'landlord')
def mark_deposit_paid(user_id):
    from datetime import datetime

    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404

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


@tenants_bp.route('/api/tenants/me/summary', methods=['GET'])
@role_required('tenant')
def my_summary():
    from routes.payments import calculate_penalty
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

    now = datetime.now()
    current_month = now.strftime('%B %Y')
    today_str = now.strftime('%Y-%m-%d')

    already_paid = conn.execute(
        "SELECT * FROM payments WHERE tenant_id = ? AND unit_id = ? AND month = ?",
        (session['user_id'], unit['unit_id'], current_month)
    ).fetchone()

    conn.close()

    penalty = 0
    if not already_paid:
        penalty = calculate_penalty(unit['rent_amount'], today_str)

    total_due = 0 if already_paid else unit['rent_amount'] + penalty

    return jsonify({
        'full_name': user['full_name'],
        'phone': user['phone'],
        'unit_number': unit['unit_number'],
        'rent_amount': unit['rent_amount'],
        'has_water_bill': unit['has_water_bill'],
        'water_bill': unit['water_bill'],
        'property_name': prop['name'],
        'location': prop['location'],
        'current_month': current_month,
        'already_paid_this_month': bool(already_paid),
        'penalty': penalty,
        'total_due': total_due,
        'agreement_signed': bool(user['agreement_signed']),
        'deposit_paid': bool(user['deposit_paid']),
    }), 200