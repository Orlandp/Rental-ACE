from flask import Blueprint, request, jsonify
from database import get_db
from routes.decorators import role_required

expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/api/expenses', methods=['GET'])
@role_required('admin', 'landlord')
def get_expenses():
    conn = get_db()
    expenses = conn.execute('SELECT * FROM expenses').fetchall()
    conn.close()

    return jsonify([dict(e) for e in expenses]), 200


@expenses_bp.route('/api/expenses', methods=['POST'])
@role_required('admin', 'landlord')
def create_expense():
    data = request.get_json(silent=True) or {}

    property_id = data.get('property_id')
    category = data.get('category')
    description = data.get('description')
    amount = data.get('amount')
    expense_date = data.get('expense_date')

    if not all([property_id, category, description, amount, expense_date]):
        return jsonify({'error': 'property_id, category, description, amount, and expense_date are required'}), 400

    conn = get_db()

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
