import os
import re
import base64
from datetime import datetime

import requests
from flask import Blueprint, request, jsonify

from database import get_db
from routes.payments import record_payment

mpesa_bp = Blueprint('mpesa', __name__)

MPESA_ENV = os.environ.get('MPESA_ENV', 'sandbox')
MPESA_BASE_URL = 'https://api.safaricom.co.ke' if MPESA_ENV == 'production' else 'https://sandbox.safaricom.co.ke'
MPESA_CONSUMER_KEY = os.environ.get('MPESA_CONSUMER_KEY', '')
MPESA_CONSUMER_SECRET = os.environ.get('MPESA_CONSUMER_SECRET', '')
# Safaricom's own published sandbox test shortcode/passkey (developer.safaricom.co.ke docs) —
# safe defaults so sandbox testing works out of the box with just a Consumer Key/Secret.
MPESA_SHORTCODE = os.environ.get('MPESA_SHORTCODE', '174379')
MPESA_PASSKEY = os.environ.get(
    'MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
)
MPESA_CALLBACK_URL = os.environ.get('MPESA_CALLBACK_URL', '')

KENYAN_PHONE_RE = re.compile(r'^254(7|1)\d{8}$')


def _normalize_phone(raw_phone):
    digits = re.sub(r'\D', '', raw_phone or '')
    if digits.startswith('0'):
        digits = '254' + digits[1:]
    elif digits.startswith('7') or digits.startswith('1'):
        digits = '254' + digits
    return digits


def get_access_token():
    creds = base64.b64encode(f'{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}'.encode()).decode()
    resp = requests.get(
        f'{MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials',
        headers={'Authorization': f'Basic {creds}'},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()['access_token']


@mpesa_bp.route('/api/mpesa/stkpush', methods=['POST'])
def stk_push():
    if not MPESA_CONSUMER_KEY or not MPESA_CONSUMER_SECRET:
        return jsonify({'error': 'M-Pesa is not configured on this server yet.'}), 503
    if not MPESA_CALLBACK_URL:
        return jsonify({'error': 'M-Pesa callback URL is not configured on this server yet.'}), 503

    data = request.get_json(silent=True) or {}
    unit_id = data.get('unit_id')
    raw_phone = data.get('phone')
    requested_amount = data.get('amount')

    if not all([unit_id, raw_phone, requested_amount]):
        return jsonify({'error': 'unit_id, phone and amount are required'}), 400

    try:
        amount = float(requested_amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'Enter a valid amount.'}), 400
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than zero.'}), 400

    phone = _normalize_phone(raw_phone)
    if not KENYAN_PHONE_RE.match(phone):
        return jsonify({'error': 'Enter a valid Kenyan phone number, e.g. 0712 345 678'}), 400

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

    try:
        token = get_access_token()
    except requests.RequestException:
        conn.close()
        return jsonify({'error': 'Could not reach M-Pesa. Please try again.'}), 502

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f'{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}'.encode()).decode()
    account_ref = unit['account_no'] or f"House{unit['unit_number']}"

    payload = {
        'BusinessShortCode': MPESA_SHORTCODE,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': int(round(amount)),
        'PartyA': phone,
        'PartyB': MPESA_SHORTCODE,
        'PhoneNumber': phone,
        'CallBackURL': MPESA_CALLBACK_URL,
        'AccountReference': account_ref,
        'TransactionDesc': f"Rent House {unit['unit_number']}",
    }

    try:
        resp = requests.post(
            f'{MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest',
            json=payload,
            headers={'Authorization': f'Bearer {token}'},
            timeout=15,
        )
        result = resp.json()
    except requests.RequestException:
        conn.close()
        return jsonify({'error': 'Could not reach M-Pesa. Please try again.'}), 502

    if result.get('ResponseCode') != '0':
        conn.close()
        error_message = result.get('errorMessage') or result.get('ResponseDescription') or 'M-Pesa request was rejected.'
        return jsonify({'error': error_message}), 502

    checkout_request_id = result['CheckoutRequestID']
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        INSERT INTO mpesa_transactions
        (checkout_request_id, merchant_request_id, unit_id, tenant_id, amount, phone, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    ''', (checkout_request_id, result.get('MerchantRequestID'), unit_id, tenant['user_id'], amount, phone, now))
    conn.commit()
    conn.close()

    return jsonify({
        'message': 'Check your phone and enter your M-Pesa PIN to complete the payment.',
        'checkout_request_id': checkout_request_id,
    }), 200


@mpesa_bp.route('/api/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Safaricom calls this asynchronously once the customer accepts/cancels
    the STK prompt on their phone. Must be publicly reachable over HTTPS —
    Safaricom cannot reach a localhost URL."""
    data = request.get_json(silent=True) or {}
    stk = ((data.get('Body') or {}).get('stkCallback')) or {}
    checkout_request_id = stk.get('CheckoutRequestID')
    result_code = stk.get('ResultCode')
    result_desc = stk.get('ResultDesc')

    conn = get_db()
    txn = conn.execute(
        'SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', (checkout_request_id,)
    ).fetchone()

    # Always acknowledge with 200 so Safaricom doesn't retry — even for a
    # transaction we don't recognize or have already processed.
    if not txn or txn['status'] != 'pending':
        conn.close()
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    if result_code == 0:
        items = {i['Name']: i.get('Value') for i in ((stk.get('CallbackMetadata') or {}).get('Item') or [])}
        mpesa_receipt = items.get('MpesaReceiptNumber')
        amount = float(items.get('Amount', txn['amount']))
        phone = str(items.get('PhoneNumber', txn['phone']))

        unit = conn.execute('SELECT * FROM units WHERE unit_id = ?', (txn['unit_id'],)).fetchone()
        tenant = conn.execute('SELECT * FROM users WHERE user_id = ?', (txn['tenant_id'],)).fetchone()

        receipt = record_payment(conn, unit, tenant, amount, phone, mpesa_receipt)

        conn.execute('''
            UPDATE mpesa_transactions
            SET status = 'success', mpesa_receipt = ?, result_desc = ?, completed_at = ?, payment_id = ?
            WHERE checkout_request_id = ?
        ''', (mpesa_receipt, result_desc, now, receipt['payment_id'], checkout_request_id))
    else:
        conn.execute('''
            UPDATE mpesa_transactions
            SET status = 'failed', result_desc = ?, completed_at = ?
            WHERE checkout_request_id = ?
        ''', (result_desc, now, checkout_request_id))

    conn.commit()
    conn.close()
    return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200


@mpesa_bp.route('/api/mpesa/status/<checkout_request_id>', methods=['GET'])
def mpesa_status(checkout_request_id):
    """Polled by PayPage while waiting for the customer to act on the STK
    prompt (Safaricom's callback can take anywhere up to ~60-90 seconds)."""
    conn = get_db()
    txn = conn.execute(
        'SELECT * FROM mpesa_transactions WHERE checkout_request_id = ?', (checkout_request_id,)
    ).fetchone()

    if not txn:
        conn.close()
        return jsonify({'error': 'Transaction not found'}), 404

    result = {'status': txn['status'], 'result_desc': txn['result_desc']}

    if txn['status'] == 'success' and txn['payment_id']:
        payment = conn.execute('''
            SELECT p.*, u.full_name AS tenant_name, un.unit_number
            FROM payments p
            JOIN users u ON p.tenant_id = u.user_id
            JOIN units un ON p.unit_id = un.unit_id
            WHERE p.payment_id = ?
        ''', (txn['payment_id'],)).fetchone()

        primary_allocation = conn.execute('''
            SELECT pa.amount, i.invoice_id, i.month, i.total_amount, i.amount_paid
            FROM payment_allocations pa
            JOIN invoices i ON pa.invoice_id = i.invoice_id
            WHERE pa.payment_id = ?
            ORDER BY i.due_date ASC LIMIT 1
        ''', (txn['payment_id'],)).fetchone()

        result['receipt'] = {
            'receipt_no': f"RCT-{payment['payment_id']:05d}",
            'payment_id': payment['payment_id'],
            'unit_number': payment['unit_number'],
            'tenant_name': payment['tenant_name'],
            'amount_paid': payment['amount'],
            'mpesa_code': payment['mpesa_code'],
            'payment_date': payment['payment_date'],
            'month': primary_allocation['month'] if primary_allocation else payment['month'],
            'invoice_no': f"INV-{primary_allocation['invoice_id']:05d}" if primary_allocation else None,
            'balance_remaining': (
                max(primary_allocation['total_amount'] - primary_allocation['amount_paid'], 0)
                if primary_allocation else 0
            ),
        }

    conn.close()
    return jsonify(result), 200
