from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

tenants_bp = Blueprint('tenants', __name__)


@tenants_bp.route('/api/tenants', methods=['GET'])
@role_required('admin', 'landlord')
def get_tenants():
    conn = get_db()
    tenants = conn.execute(
        "SELECT user_id, full_name, username, phone, id_number, role, unit_id, status, created_at FROM users WHERE role = 'tenant'"
    ).fetchall()
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
#approval 
@tenants_bp.route('/api/tenants/<int:user_id>/approve', methods=['PUT'])
@role_required('admin', 'landlord')
def approve_tenants(user_id):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE user_id =? AND role ='tenant'", (user_id,)
    ).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Tenant not Found'}), 404
    
    if user['status'] == 'active':
        conn.close()
        return jsonify({'error': 'Tenant already active'}), 400
    data = request.get_json(silent=True) or{}
    unit_id = data.get('unit_id', user['unit_id'])

    conn.execute(
        "UPDATE users SET status = 'active', unit_id = ? WHERE user_id = ?",
        (unit_id, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({'message': f"Tenant {user['full_name']} approved successfully"}), 200
