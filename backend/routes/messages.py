from flask import Blueprint, request, jsonify
from database import get_db
from routes.decorators import role_required

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/api/messages/send', methods=['POST'])
@role_required('admin', 'landlord')
def send_message():
    data = request.get_json(silent=True) or {}

    recipient = data.get('recipient')
    content = data.get('content')

    if not all([recipient, content]):
        return jsonify({'error': 'recipient and content are required'}), 400

    conn = get_db()
    cursor = conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, datetime('now'), 'sent')
    ''', (recipient, content))

    message_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Message logged successfully',
        'message_id': message_id
    }), 201


@messages_bp.route('/api/messages', methods=['GET'])
@role_required('admin', 'landlord')
def get_messages():
    conn = get_db()
    messages = conn.execute('SELECT * FROM messages ORDER BY sent_at DESC').fetchall()
    conn.close()

    return jsonify([dict(m) for m in messages]), 200
