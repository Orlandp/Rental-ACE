from datetime import datetime
from flask import Blueprint, request, jsonify, session
from database import get_db
from routes.decorators import login_required, role_required

water_bills_bp = Blueprint('water_bills', __name__)


def _agent_can_access_unit(conn, unit):
    if session['role'] != 'agent':
        return True
    agent = conn.execute(
        'SELECT assigned_property_id FROM users WHERE user_id = ?', (session['user_id'],)
    ).fetchone()
    return bool(agent) and unit['property_id'] == agent['assigned_property_id']


@water_bills_bp.route('/api/water-bills', methods=['POST'])
@role_required('admin', 'landlord', 'agent')
def set_water_bill():
    data = request.get_json(silent=True) or {}

    unit_id = data.get('unit_id')
    amount = data.get('amount')
    month = data.get('month')
    year = data.get('year')

    if not all([unit_id, amount, month, year]):
        return jsonify({'error': 'unit_id, amount, month, and year are required'}), 400

    conn = get_db()

    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()

    if not unit:
        conn.close()
        return jsonify({'error': 'Unit not found'}), 404

    if not _agent_can_access_unit(conn, unit):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403

    if not unit['has_water_bill']:
        conn.close()
        return jsonify({'error': 'This unit does not have water billing'}), 400

    existing = conn.execute(
        'SELECT * FROM water_bills WHERE unit_id = ? AND month = ? AND year = ?',
        (unit_id, month, year)
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({
            'error': f'A water bill for {month} {year} was already recorded for this unit '
                     f'(Ksh {existing["amount"]:,.0f}, confirmed earlier). Delete it first if this needs correcting.'
        }), 409

    tenant = conn.execute(
        "SELECT * FROM users WHERE unit_id = ? AND role = 'tenant' AND status = 'active'",
        (unit_id,)
    ).fetchone()

    cursor = conn.execute('''
        INSERT INTO water_bills (unit_id, tenant_id, amount, month, year)
        VALUES (?, ?, ?, ?, ?)
    ''', (unit_id, tenant['user_id'] if tenant else None, amount, month, year))

    bill_id = cursor.lastrowid

    if tenant:
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn.execute('''
            INSERT INTO messages (recipient, content, sent_at, status)
            VALUES (?, ?, ?, 'sent')
        ''', (
            tenant['phone'],
            f"Dear {tenant['full_name']}, your water bill of Ksh {amount:,.0f} for House {unit['unit_number']} "
            f"({month} {year}) has been confirmed as paid. Thank you!",
            now_str,
        ))

    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Water bill recorded successfully',
        'bill_id': bill_id,
        'tenant_notified': bool(tenant),
    }), 201


@water_bills_bp.route('/api/water-bills/<int:unit_id>', methods=['GET'])
@login_required
def get_water_bill_history(unit_id):
    conn = get_db()

    if session['role'] not in ('admin', 'landlord'):
        if session['role'] == 'agent':
            unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (unit_id,)).fetchone()
            if not unit or not _agent_can_access_unit(conn, unit):
                conn.close()
                return jsonify({'error': 'Forbidden'}), 403
        else:
            user = conn.execute(
                'SELECT unit_id FROM users WHERE user_id = ?', (session['user_id'],)
            ).fetchone()
            if not user or user['unit_id'] != unit_id:
                conn.close()
                return jsonify({'error': 'Forbidden'}), 403

    bills = conn.execute(
        'SELECT * FROM water_bills WHERE unit_id = ? ORDER BY year DESC, month DESC',
        (unit_id,)
    ).fetchall()
    conn.close()

    return jsonify([dict(b) for b in bills]), 200


@water_bills_bp.route('/api/water-bills/<int:bill_id>/receipt/pdf', methods=['GET'])
@login_required
def download_water_bill_receipt(bill_id):
    from flask import send_file
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    conn = get_db()

    bill = conn.execute('''
        SELECT wb.*, un.unit_number, un.property_id, pr.name AS property_name
        FROM water_bills wb
        JOIN units un ON wb.unit_id = un.unit_id
        JOIN properties pr ON un.property_id = pr.property_id
        WHERE wb.bill_id = ?
    ''', (bill_id,)).fetchone()

    if not bill:
        conn.close()
        return jsonify({'error': 'Water bill entry not found'}), 404

    if session['role'] == 'agent':
        unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (bill['unit_id'],)).fetchone()
        if not _agent_can_access_unit(conn, unit):
            conn.close()
            return jsonify({'error': 'Forbidden'}), 403
    elif session['role'] not in ('admin', 'landlord') and session['user_id'] != bill['tenant_id']:
        conn.close()
        return jsonify({'error': 'Forbidden'}), 403

    tenant = conn.execute(
        'SELECT full_name FROM users WHERE user_id = ?', (bill['tenant_id'],)
    ).fetchone() if bill['tenant_id'] else None
    conn.close()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"{bill['property_name']} — Water Bill Receipt", styles['Title']))
    elements.append(Spacer(1, 16))

    receipt_data = [
        ['Receipt No', f"WTR-{bill['bill_id']:05d}"],
        ['Tenant', tenant['full_name'] if tenant else '—'],
        ['House', f"House {bill['unit_number']}"],
        ['Billing Period', f"{bill['month']} {bill['year']}"],
        ['Amount Confirmed Paid', f"Ksh {bill['amount']:,.0f}"],
        ['Paid To', 'Eldowas'],
    ]
    receipt_table = Table(receipt_data, colWidths=[160, 240])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5ee')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(receipt_table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "This confirms that the above water bill, paid directly to Eldowas, has been recorded "
        "against this tenancy. This is a separate charge from rent.",
        styles['Normal']
    ))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"water-receipt-WTR-{bill['bill_id']:05d}.pdf"
    )


@water_bills_bp.route('/api/water-bills/<int:bill_id>', methods=['DELETE'])
@role_required('admin', 'landlord')
def delete_water_bill(bill_id):
    conn = get_db()

    bill = conn.execute('SELECT * FROM water_bills WHERE bill_id = ?', (bill_id,)).fetchone()
    if not bill:
        conn.close()
        return jsonify({'error': 'Water bill entry not found'}), 404

    conn.execute('DELETE FROM water_bills WHERE bill_id = ?', (bill_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Water bill entry deleted successfully'}), 200
