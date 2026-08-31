from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import role_required

expenses_bp = Blueprint('expenses', __name__)


def _agent_property_id(conn):
    agent = conn.execute(
        'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
    ).fetchone()
    return agent['assigned_property_id'] if agent else None


@expenses_bp.route('/api/expenses', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def get_expenses():
    conn = get_db()

    if session['role'] == 'agent':
        property_id = _agent_property_id(conn)
        expenses = conn.execute(
            'SELECT * FROM expenses WHERE property_id = ?', (property_id,)
        ).fetchall() if property_id else []
    else:
        expenses = conn.execute('SELECT * FROM expenses').fetchall()

    conn.close()

    return jsonify([dict(e) for e in expenses]), 200


@expenses_bp.route('/api/expenses', methods=['POST'])
@role_required('admin', 'landlord', 'agent')
def create_expense():
    data = request.get_json(silent=True) or {}

    property_id = data.get('property_id')
    category = data.get('category')
    description = data.get('description')
    amount = data.get('amount')
    expense_date = data.get('expense_date')

    conn = get_db()

    if session['role'] == 'agent':
        property_id = _agent_property_id(conn)
        if not property_id:
            conn.close()
            return jsonify({'error': 'You are not yet assigned to a property'}), 400

    if not all([property_id, category, description, amount, expense_date]):
        conn.close()
        return jsonify({'error': 'property_id, category, description, amount, and expense_date are required'}), 400

    prop = conn.execute('SELECT * FROM properties WHERE property_id = ?', (property_id,)).fetchone()
    if not prop:
        conn.close()
        return jsonify({'error': 'Property not found'}), 404

    cursor = conn.execute('''
        INSERT INTO expenses (property_id, category, description, amount, expense_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (property_id, category, description, amount, expense_date))

    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Expense recorded successfully',
        'expense_id': expense_id
    }), 201


@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_expense(expense_id):
    conn = get_db()

    expense = conn.execute('SELECT * FROM expenses WHERE expense_id = ?', (expense_id,)).fetchone()
    if not expense:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404

    conn.execute('DELETE FROM expenses WHERE expense_id = ?', (expense_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Expense deleted successfully'}), 200
