from flask import Blueprint, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db 


auth_bp = Blueprint('auth',__name__)
ADMIN_SECRET_CODE = ' admin2026'
LANDLORD_SECRET_CODE = ' landlord 2026 ' 

@auth_bp.route('/api/auth/register', methods=['POST'])

def register():
    data = request.get_json()

    full_name = data.get('full_name')
    username = data.get('username')
    phone = data.get('phone')
    id_number = data.get('id_number')
    password = data.get('password')
    role = data.get('role')
    secret_code =data.get('secret_code')

    if role == 'admin' and secret_code !=  ADMIN_SECRET_CODE:
        return jsonify({'error': 'Not valid'}), 403
    
    if role == 'landlord' and secret_code != LANDLORD_SECRET_CODE:
        return jsonify({'error': 'invalid code'}), 403

    if not all([full_name, username, phone, password, role,]):
        return jsonify({'error': 'the details can not load'}), 400
    
    
    conn = get_db()
    
    existing = conn.execute(
        'SELECT user_id FROM users WHERE username = ?', (username,)
    ).fetchone()

    if existing:
        conn.close()
        return jsonify({'error': 'Username already taken'}), 409
    
    hashed_password = generate_password_hash(password)

    conn.execute('''
        INSERT INTO users (full_name, username, phone, id_number, password, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    ''', (full_name, username, phone, id_number, hashed_password, role))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Registration successful, awaiting admin approval'}), 201
@auth_bp.route('/api/auth/login', methods=['POST'])

def login ():
    data =request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ? ', (username,)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Invaild username and  password'}), 401
    
    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'invalid username and password'}), 401

    if user['status'] != 'active':
        return jsonify({'error': 'Account on pending'}), 403

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