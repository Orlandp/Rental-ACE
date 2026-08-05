from datetime import datetime
from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required
from routes.payments import calculate_penalty

invoices_bp = Blueprint('invoices', __name__)


@invoices_bp.route('/api/invoices', methods=['POST'])
@role_required('admin', 'landlord')
def create_invoice():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    if not unit_id:
        return jsonify({'error': 'unit_id is required'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()
    if not tenant:
        conn.close()
        return jsonify({'error': 'No active tenant found for this unit'}), 404

    now = datetime.now()
    month = data.get('month') or now.strftime('%B %Y')

    existing = conn.execute(
        "SELECT * FROM invoices WHERE unit_id = ? AND month = ? AND status != 'void'",
        (unit_id, month)
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': f'An invoice for {month} already exists for this unit'}), 400

    rent_amount = unit['rent_amount']
    water_amount = unit['water_bill'] if unit['has_water_bill'] else 0
    penalty = calculate_penalty(rent_amount, now.strftime('%Y-%m-%d'))
    total_amount = rent_amount + water_amount + penalty

    due_date = data.get('due_date')
    if not due_date:
        month_start = datetime.strptime(month, '%B %Y')
        due_date = month_start.replace(day=unit['penalty_date']).strftime('%Y-%m-%d')

    created_at = now.strftime('%Y-%m-%d %H:%M:%S')

    cursor = conn.execute('''
        INSERT INTO invoices
        (tenant_id, unit_id, month, rent_amount, water_amount, penalty, total_amount, due_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)
    ''', (tenant['user_id'], unit_id, month, rent_amount, water_amount, penalty, total_amount, due_date, created_at))

    invoice_id = cursor.lastrowid

    conn.execute('''
        INSERT INTO messages (recipient, content, sent_at, status)
        VALUES (?, ?, datetime('now'), 'sent')
    ''', (
        tenant['phone'],
        f"Dear {tenant['full_name']}, your invoice for House {unit['unit_number']} for {month} is ready. "
        f"Amount due: Ksh {total_amount:,.0f}. Please pay by {due_date}."
    ))

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Invoice created successfully',
        'invoice': {
            'invoice_id': invoice_id,
            'tenant_id': tenant['user_id'],
            'tenant_name': tenant['full_name'],
            'unit_id': unit_id,
            'unit_number': unit['unit_number'],
            'month': month,
            'rent_amount': rent_amount,
            'water_amount': water_amount,
            'penalty': penalty,
            'total_amount': total_amount,
            'due_date': due_date,
            'status': 'unpaid',
        }
    }), 201


@invoices_bp.route('/api/invoices', methods=['GET'])
@login_required
def get_invoices():
    conn = get_db()

    if session['role'] in ('admin', 'landlord'):
        invoices = conn.execute('''
            SELECT i.*, u.full_name AS tenant_name, un.unit_number
            FROM invoices i
            JOIN users u ON i.tenant_id = u.user_id
            JOIN units un ON i.unit_id = un.unit_id
            ORDER BY i.created_at DESC
        ''').fetchall()
    else:
        invoices = conn.execute('''
            SELECT i.*, un.unit_number
            FROM invoices i
            JOIN units un ON i.unit_id = un.unit_id
            WHERE i.tenant_id = ?
            ORDER BY i.created_at DESC
        ''', (session['user_id'],)).fetchall()

    conn.close()
    return jsonify([dict(i) for i in invoices]), 200


@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['GET'])
@login_required
def get_invoice(invoice_id):
    conn = get_db()

    invoice = conn.execute('''
        SELECT i.*, u.full_name AS tenant_name, un.unit_number
        FROM invoices i
        JOIN users u ON i.tenant_id = u.user_id
        JOIN units un ON i.unit_id = un.unit_id
        WHERE i.invoice_id = ?
    ''', (invoice_id,)).fetchone()

    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404

    if session['role'] not in ('admin', 'landlord') and invoice['tenant_id'] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    conn.close()
    return jsonify(dict(invoice)), 200


@invoices_bp.route('/api/invoices/<int:invoice_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_invoice(invoice_id):
    conn = get_db()

    invoice = conn.execute('SELECT * FROM invoices WHERE invoice_id = ?', (invoice_id,)).fetchone()
    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404

    if invoice['status'] == 'paid':
        conn.close()
        return jsonify({'error': 'Cannot delete a paid invoice'}), 400

    conn.execute('DELETE FROM invoices WHERE invoice_id = ?', (invoice_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Invoice deleted successfully'}), 200
