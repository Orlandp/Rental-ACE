import secrets
import string
from datetime import datetime
from flask import Blueprint, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from routes.decorators import login_required, role_required


auth_bp = Blueprint('auth', __name__)
ADMIN_SECRET_CODE = 'admin2026'
LANDLORD_SECRET_CODE = 'landlord2026'
AGENT_SECRET_CODE = 'agent2026'


@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    full_name = data.get('full_name')
    username = data.get('username')
    phone = data.get('phone')
    id_number = data.get('id_number')
    password = data.get('password')
    role = data.get('role')
    secret_code = data.get('secret_code')

    if role == 'admin' and secret_code != ADMIN_SECRET_CODE:
        return jsonify({'error': 'Not valid'}), 403

    if role == 'landlord' and secret_code != LANDLORD_SECRET_CODE:
        return jsonify({'error': 'invalid code'}), 403

    if role == 'agent' and secret_code != AGENT_SECRET_CODE:
        return jsonify({'error': 'invalid code'}), 403

    if role not in ('tenant', 'admin', 'landlord', 'agent'):
        return jsonify({'error': 'Invalid role'}), 400

    if not all([full_name, username, phone, password, role]):
        return jsonify({'error': 'the details can not load'}), 400

    if role == 'agent' and not data.get('assigned_property_id'):
        return jsonify({'error': 'Please select the property you are assigned to'}), 400

    conn = get_db()

    existing = conn.execute(
        'SELECT user_id FROM users WHERE username = ?', (username,)
    ).fetchone()

    if existing:
        conn.close()
        return jsonify({'error': 'Username already taken'}), 409

    unit_id = data.get('unit_id')

    if role == 'tenant' and unit_id:
        occupied = conn.execute(
            "SELECT full_name FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
            (unit_id,)
        ).fetchone()
        if occupied:
            conn.close()
            return jsonify({'error': 'That house is already occupied. Please choose a different house.'}), 409

    hashed_password = generate_password_hash(password)
    assigned_property_id = data.get('assigned_property_id') if role == 'agent' else None

    from datetime import datetime
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        INSERT INTO users (full_name, username, phone, id_number, password, role, unit_id, assigned_property_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    ''', (full_name, username, phone, id_number, hashed_password, role, unit_id, assigned_property_id, now))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Registration successful, awaiting admin approval'}), 201


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid username or password'}), 401

    if user['status'] == 'rejected':
        return jsonify({'error': 'Your application was not approved. Please contact the office.'}), 403

    if user['status'] != 'active':
        return jsonify({'error': 'Account not yet approved'}), 403

    session['user_id'] = user['user_id']
    session['role'] = user['role']

    return jsonify({
        'message': 'login successful',
        'user': {
            'user_id': user['user_id'],
            'full_name': user['full_name'],
            'username': user['username'],
            'role': user['role'],
        }
    }), 200
@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'logged out'}), 200


@auth_bp.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    conn = get_db()
    user = conn.execute(
        'SELECT user_id, full_name, username, role, unit_id, assigned_property_id FROM users WHERE user_id = ?',
        (session['user_id'],)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(dict(user)), 200


@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    phone = (data.get('phone') or '').strip()

    generic_response = jsonify({
        'message': "If those details match an account, your request has been sent. "
                   "Your admin or agent will contact you with a new password shortly."
    })

    if not username or not phone:
        return generic_response, 200

    conn = get_db()
    user = conn.execute(
        'SELECT user_id, phone, status FROM users WHERE username = ?', (username,)
    ).fetchone()

    if user and user['phone'] == phone and user['status'] == 'active':
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn.execute(
            'UPDATE users SET password_reset_requested = 1, password_reset_requested_at = ? WHERE user_id = ?',
            (now, user['user_id'])
        )
        conn.commit()

    conn.close()
    return generic_response, 200


def _agent_can_access_user(conn, target_user):
    from routes.tenant import agent_can_access_tenant
    return agent_can_access_tenant(conn, target_user)


@auth_bp.route('/api/auth/password-reset-requests', methods=['GET'])
@role_required('admin', 'agent')
def get_password_reset_requests():
    conn = get_db()

    if session['role'] == 'agent':
        agent = conn.execute(
            'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
        ).fetchone()
        property_id = agent['assigned_property_id'] if agent else None
        rows = conn.execute('''
            SELECT u.user_id, u.full_name, u.username, u.phone, u.role, u.password_reset_requested_at
            FROM users u
            JOIN units un ON u.unit_id = un.unit_id
            WHERE u.password_reset_requested = 1 AND un.property_id = ?
            ORDER BY u.password_reset_requested_at ASC
        ''', (property_id,)).fetchall() if property_id else []
    else:
        rows = conn.execute('''
            SELECT user_id, full_name, username, phone, role, password_reset_requested_at
            FROM users
            WHERE password_reset_requested = 1
            ORDER BY password_reset_requested_at ASC
        ''').fetchall()

    conn.close()
    return jsonify([dict(r) for r in rows]), 200


@auth_bp.route('/api/auth/password-reset-requests/<int:user_id>/approve', methods=['PUT'])
@role_required('admin', 'agent')
def approve_password_reset(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    if not _agent_can_access_user(conn, user):
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    alphabet = string.ascii_uppercase + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(8))
    hashed_password = generate_password_hash(temp_password)

    conn.execute(
        'UPDATE users SET password = ?, password_reset_requested = 0, password_reset_requested_at = NULL WHERE user_id = ?',
        (hashed_password, user_id)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Password reset. Share this temporary password with the user directly.',
        'temp_password': temp_password,
    }), 200


@auth_bp.route('/api/auth/password-reset-requests/<int:user_id>', methods=['DELETE'])
@role_required('admin', 'agent')
def dismiss_password_reset(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'User not found'}), 404

    if not _agent_can_access_user(conn, user):
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    conn.execute(
        'UPDATE users SET password_reset_requested = 0, password_reset_requested_at = NULL WHERE user_id = ?',
        (user_id,)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Request dismissed'}), 200