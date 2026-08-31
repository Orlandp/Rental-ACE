from datetime import datetime
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash
from database import get_db
from routes.decorators import role_required

agents_bp = Blueprint('agents', __name__)


def _agent_property_id(conn):
    agent = conn.execute(
        'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
    ).fetchone()
    return agent['assigned_property_id'] if agent else None


@agents_bp.route('/api/agents/pending', methods=['GET'])
@role_required('admin', 'landlord')
def get_pending_agents():
    conn = get_db()
    pending = conn.execute('''
        SELECT u.user_id, u.full_name, u.username, u.phone, u.id_number,
               u.assigned_property_id, u.created_at, p.name AS property_name
        FROM users u
        LEFT JOIN properties p ON u.assigned_property_id = p.property_id
        WHERE u.role = 'agent' AND u.status = 'pending'
    ''').fetchall()
    conn.close()

    return jsonify([dict(p) for p in pending]), 200


@agents_bp.route('/api/agents', methods=['GET'])
@role_required('admin', 'landlord')
def get_agents():
    conn = get_db()
    agents = conn.execute('''
        SELECT u.user_id, u.full_name, u.username, u.phone, u.status,
               u.assigned_property_id, u.created_at, p.name AS property_name
        FROM users u
        LEFT JOIN properties p ON u.assigned_property_id = p.property_id
        WHERE u.role = 'agent' AND u.status != 'pending'
    ''').fetchall()
    conn.close()

    return jsonify([dict(a) for a in agents]), 200


@agents_bp.route('/api/agents/<int:user_id>/approve', methods=['PUT'])
@role_required('admin', 'landlord')
def approve_agent(user_id):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'agent'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Agent not found'}), 404

    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Agent already active'}), 400

    data = request.get_json(silent=True) or {}
    assigned_property_id = data.get('assigned_property_id', user['assigned_property_id'])

    conn.execute(
        "UPDATE users SET status = 'active', assigned_property_id = ? WHERE user_id = ?",
        (assigned_property_id, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({'message': f"Agent {user['full_name']} approved successfully"}), 200


@agents_bp.route('/api/agents/<int:user_id>/reject', methods=['DELETE'])
@role_required('admin', 'landlord')
def reject_agent(user_id):
    conn = get_db()

    user = conn.execute(
        "SELECT * FROM users WHERE user_id = ? AND role = 'agent'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Agent not found'}), 404

    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Already an active agent'}), 400

    conn.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': f"Applicant {user['full_name']} rejected"}), 200


@agents_bp.route('/api/agents/me/tenants', methods=['GET'])
@role_required('agent')
def get_my_property_tenants():
    conn = get_db()

    property_id = _agent_property_id(conn)

    if not property_id:
        conn.close()
        return jsonify({'error': 'You are not yet assigned to a property'}), 400

    tenants = conn.execute('''
        SELECT u.user_id, u.full_name, u.username, u.phone, u.id_number, u.status,
               u.deposit_paid, u.deposit_paid_at, u.deposit_amount_paid,
               u.agreement_signed, u.agreement_signed_at, u.id_photo_path,
               u.id_photo_verified, u.id_photo_verified_at, u.id_photo_requested,
               un.unit_id, un.unit_number, un.rent_amount, un.deposit_amount AS unit_deposit_amount
        FROM users u
        JOIN units un ON u.unit_id = un.unit_id
        WHERE u.role = 'tenant' AND u.status IN ('active', 'vacated') AND un.property_id = ?
    ''', (property_id,)).fetchall()

    from routes.invoices import refresh_invoice_penalty

    now = datetime.now()
    result = []
    for t in tenants:
        row = dict(t)

        if t['status'] != 'active':
            row['current_status'] = None
            row['balance_due'] = 0
            result.append(row)
            continue

        invoice = conn.execute('''
            SELECT * FROM invoices
            WHERE unit_id = ? AND status IN ('unpaid', 'partial')
            ORDER BY due_date ASC, invoice_id ASC LIMIT 1
        ''', (t['unit_id'],)).fetchone()

        if invoice:
            penalty, total_amount = refresh_invoice_penalty(conn, invoice, now)
            row['current_status'] = invoice['status']
            row['balance_due'] = total_amount - invoice['amount_paid']
        else:
            row['current_status'] = 'paid'
            row['balance_due'] = 0

        result.append(row)

    conn.commit()
    conn.close()

    return jsonify(result), 200


@agents_bp.route('/api/agents/me/tenants', methods=['POST'])
@role_required('agent')
def add_walk_in_tenant():
    data = request.get_json(silent=True) or {}

    full_name = data.get('full_name')
    username = data.get('username')
    phone = data.get('phone')
    id_number = data.get('id_number')
    password = data.get('password')
    unit_id = data.get('unit_id')

    if not all([full_name, username, phone, password, unit_id]):
        return jsonify({'error': 'full_name, username, phone, password and unit_id are required'}), 400

    conn = get_db()

    property_id = _agent_property_id(conn)
    if not property_id:
        conn.close()
        return jsonify({'error': 'You are not yet assigned to a property'}), 400

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit or unit['property_id'] != property_id:
        conn.close()
        return jsonify({'error': 'That unit is not in your assigned property'}), 403

    existing_tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'", (unit_id,)
    ).fetchone()
    if existing_tenant:
        conn.close()
        return jsonify({'error': f"{existing_tenant['full_name']} is already the active tenant in this unit"}), 400

    existing_username = conn.execute(
        'SELECT user_id FROM users WHERE username = ?', (username,)
    ).fetchone()
    if existing_username:
        conn.close()
        return jsonify({'error': 'Username already taken'}), 409

    hashed_password = generate_password_hash(password)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cursor = conn.execute('''
        INSERT INTO users (full_name, username, phone, id_number, password, role, unit_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'tenant', ?, 'active', ?)
    ''', (full_name, username, phone, id_number, hashed_password, unit_id, now))

    new_user_id = cursor.lastrowid

    conn.execute("UPDATE units SET status = 'OCCUPIED' WHERE unit_id = ?", (unit_id,))

    conn.commit()
    conn.close()

    return jsonify({
        'message': f'{full_name} added as a tenant in House {unit["unit_number"]}',
        'user_id': new_user_id,
    }), 201
