import io
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, session, send_file
from database import get_db
from routes.decorators import login_required, role_required
from routes.payments import (
    calculate_penalty,
    PENALTY_GRACE_DAY,
    PENALTY_ESCALATION_DAY,
    PENALTY_RATE_TIER1,
    PENALTY_RATE_TIER2,
)

agreement_bp = Blueprint('agreement', __name__)

ID_PHOTO_SUBDIR = 'id_photos'


def _uploads_base_dir():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')


def _id_photo_fs_path(url_path):
    """Resolve a stored '/uploads/id_photos/<file>' DB value to a filesystem path."""
    if not url_path:
        return None
    rel = url_path.lstrip('/')
    if rel.startswith('uploads/'):
        rel = rel[len('uploads/'):]
    return os.path.join(_uploads_base_dir(), rel)


def get_template_row(conn):
    return conn.execute(
        'SELECT * FROM agreement_template ORDER BY id DESC LIMIT 1'
    ).fetchone()


def get_penalty_terms(rent_amount):
    now = datetime.now()
    sample_month = now.strftime('%Y-%m')
    tier1_date = f'{sample_month}-{PENALTY_GRACE_DAY + 1:02d}'
    tier2_date = f'{sample_month}-{PENALTY_ESCALATION_DAY + 1:02d}'

    return {
        'grace_day': PENALTY_GRACE_DAY,
        'escalation_day': PENALTY_ESCALATION_DAY,
        'tier1_rate': PENALTY_RATE_TIER1,
        'tier2_rate': PENALTY_RATE_TIER2,
        'tier1_amount': calculate_penalty(rent_amount, tier1_date),
        'tier2_amount': calculate_penalty(rent_amount, tier2_date),
    }


@agreement_bp.route('/api/agreement/template', methods=['GET'])
@login_required
def get_agreement_template():
    conn = get_db()
    template = get_template_row(conn)
    conn.close()

    if not template:
        return jsonify({'error': 'No agreement template found'}), 404

    return jsonify(dict(template)), 200


@agreement_bp.route('/api/agreement/template', methods=['PUT'])
@role_required('admin', 'landlord')
def update_agreement_template():
    data = request.get_json(silent=True) or {}
    content = data.get('content')

    if not content:
        return jsonify({'error': 'content is required'}), 400

    conn = get_db()
    template = get_template_row(conn)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if template:
        conn.execute(
            'UPDATE agreement_template SET content = ?, updated_at = ? WHERE id = ?',
            (content, now, template['id'])
        )
    else:
        conn.execute(
            'INSERT INTO agreement_template (content, updated_at) VALUES (?, ?)',
            (content, now)
        )

    conn.commit()
    conn.close()

    return jsonify({'message': 'Agreement template updated successfully'}), 200


def get_tenant_agreement_data(conn, user_id):
    tenant = conn.execute('SELECT * FROM users WHERE user_id = ?', (user_id,)).fetchone()
    unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (tenant['unit_id'],)).fetchone()
    template = get_template_row(conn)
    return tenant, unit, template


@agreement_bp.route('/api/tenants/me/agreement', methods=['GET'])
@role_required('tenant')
def get_my_agreement():
    conn = get_db()
    tenant, unit, template = get_tenant_agreement_data(conn, session['user_id'])
    conn.close()

    if not unit:
        return jsonify({'error': 'No unit assigned to this tenant'}), 404
    if not template:
        return jsonify({'error': 'No agreement template found'}), 404

    return jsonify({
        'full_name': tenant['full_name'],
        'unit_number': unit['unit_number'],
        'rent_amount': unit['rent_amount'],
        'deposit_amount': unit['deposit_amount'],
        'penalty_terms': get_penalty_terms(unit['rent_amount']),
        'template_content': template['content'],
        'agreement_signed': bool(tenant['agreement_signed']),
        'agreement_signed_at': tenant['agreement_signed_at'],
        'id_photo_path': tenant['id_photo_path'],
        'id_photo_verified': bool(tenant['id_photo_verified']),
        'id_photo_requested': bool(tenant['id_photo_requested']),
        'deposit_paid': bool(tenant['deposit_paid']),
        'deposit_paid_at': tenant['deposit_paid_at'],
    }), 200


@agreement_bp.route('/api/tenants/me/agreement/sign', methods=['POST'])
@role_required('tenant')
def sign_my_agreement():
    from werkzeug.utils import secure_filename

    photo = request.files.get('id_photo')
    if not photo or not photo.filename:
        return jsonify({'error': 'Please upload a photo of your ID or passport to sign.'}), 400

    user_id = session['user_id']
    now = datetime.now()
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')

    upload_dir = os.path.join(_uploads_base_dir(), ID_PHOTO_SUBDIR)
    os.makedirs(upload_dir, exist_ok=True)

    safe_name = secure_filename(photo.filename)
    stored_name = f"tenant{user_id}_{int(now.timestamp())}_{safe_name}"
    photo.save(os.path.join(upload_dir, stored_name))
    photo_url_path = f"/uploads/{ID_PHOTO_SUBDIR}/{stored_name}"

    conn = get_db()
    conn.execute('''
        UPDATE users
        SET agreement_signed = 1, agreement_signed_at = ?, id_photo_path = ?,
            id_photo_requested = 0, id_photo_verified = 0
        WHERE user_id = ?
    ''', (now_str, photo_url_path, user_id))
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Agreement signed successfully',
        'agreement_signed_at': now_str,
        'id_photo_path': photo_url_path,
    }), 200


def build_agreement_pdf(tenant, unit, template):
    """Build the tenancy agreement PDF for a given tenant/unit/template, embedding
    the tenant's uploaded ID/passport photo as their signature when present."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
    from reportlab.lib.styles import getSampleStyleSheet

    penalty_terms = get_penalty_terms(unit['rent_amount'])

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Ace Apartments — Tenancy Agreement", styles['Title']))
    elements.append(Spacer(1, 12))

    details_data = [
        ['Tenant', tenant['full_name']],
        ['Unit', f"House {unit['unit_number']}"],
        ['Monthly Rent', f"Ksh {unit['rent_amount']:,.0f}"],
        ['Security Deposit', f"Ksh {unit['deposit_amount']:,.0f}"],
        ['Penalty (6th–10th)', f"{penalty_terms['tier1_rate'] * 100:.0f}% — Ksh {penalty_terms['tier1_amount']:,.0f}"],
        ['Penalty (11th onward)', f"{penalty_terms['tier2_rate'] * 100:.0f}% — Ksh {penalty_terms['tier2_amount']:,.0f}"],
        ['Agreement Status', 'SIGNED' if tenant['agreement_signed'] else 'NOT SIGNED'],
        ['Signed At', tenant['agreement_signed_at'] or '—'],
        ['Contract Approval', 'APPROVED' if tenant['id_photo_verified'] else 'PENDING REVIEW'],
        ['Approved At', tenant['id_photo_verified_at'] or '—'],
    ]
    details_table = Table(details_data, colWidths=[160, 240])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5ee')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 24))

    elements.append(Paragraph("Agreement Terms", styles['Heading2']))
    for paragraph in template['content'].split('\n\n'):
        clean = paragraph.strip().replace('\n', '<br/>')
        if clean:
            elements.append(Paragraph(clean, styles['Normal']))
            elements.append(Spacer(1, 10))

    elements.append(Spacer(1, 14))
    elements.append(Paragraph("Tenant Signature (ID/Passport Photo)", styles['Heading2']))

    photo_fs_path = _id_photo_fs_path(tenant['id_photo_path']) if tenant['agreement_signed'] else None
    if photo_fs_path and os.path.isfile(photo_fs_path):
        try:
            from PIL import Image as PILImage
            with PILImage.open(photo_fs_path) as im:
                img_w, img_h = im.size
            max_w, max_h = 220, 280
            scale = min(max_w / img_w, max_h / img_h, 1)
            elements.append(RLImage(photo_fs_path, width=img_w * scale, height=img_h * scale))
        except Exception:
            elements.append(Paragraph("(ID/passport photo on file could not be rendered)", styles['Normal']))
    else:
        elements.append(Paragraph("No ID/passport photo on file.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer


@agreement_bp.route('/api/tenants/me/agreement/pdf', methods=['GET'])
@role_required('tenant')
def download_my_agreement_pdf():
    conn = get_db()
    tenant, unit, template = get_tenant_agreement_data(conn, session['user_id'])
    conn.close()

    if not unit:
        return jsonify({'error': 'No unit assigned to this tenant'}), 404
    if not template:
        return jsonify({'error': 'No agreement template found'}), 404

    buffer = build_agreement_pdf(tenant, unit, template)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"tenancy-agreement-house-{unit['unit_number']}.pdf"
    )


@agreement_bp.route('/api/tenants/<int:user_id>/agreement/pdf', methods=['GET'])
@role_required('admin', 'landlord', 'agent')
def download_tenant_agreement_pdf(user_id):
    from routes.tenant import agent_can_access_tenant

    conn = get_db()
    tenant, unit, template = get_tenant_agreement_data(conn, user_id)

    if not tenant or tenant['role'] != 'tenant':
        conn.close()
        return jsonify({'error': 'Tenant not found'}), 404
    if not agent_can_access_tenant(conn, tenant):
        conn.close()
        return jsonify({'error': 'you are not allowed'}), 403
    if not unit:
        conn.close()
        return jsonify({'error': 'No unit assigned to this tenant'}), 404
    if not template:
        conn.close()
        return jsonify({'error': 'No agreement template found'}), 404

    conn.close()
    buffer = build_agreement_pdf(tenant, unit, template)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"tenancy-agreement-house-{unit['unit_number']}.pdf"
    )
