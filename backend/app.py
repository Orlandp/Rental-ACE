import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory, jsonify, session
from flask_cors import CORS
from routes.auth import auth_bp
from routes.units import units_bp
from routes.tenant import tenants_bp, agent_can_access_tenant
from routes.properties import properties_bp
from routes.payments import payments_bp
from routes.expenses import expenses_bp
from routes.messages import messages_bp
from routes.water_bills import water_bills_bp
from routes.reports import reports_bp
from routes.invoices import invoices_bp
from routes.agreement import agreement_bp
from routes.agents import agents_bp
from routes.mpesa import mpesa_bp
from routes.decorators import login_required
from database import get_db

IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production'

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'change this to something later')
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if IS_PRODUCTION else 'Lax'
app.config['SESSION_COOKIE_SECURE'] = IS_PRODUCTION

cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, supports_credentials=True, origins=cors_origins)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

SENSITIVE_UPLOAD_SUBDIRS = ('id_photos', 'vacate_evidence')


@app.route('/uploads/<subdir>/<path:filename>')
@login_required
def uploaded_file(subdir, filename):
    if subdir not in SENSITIVE_UPLOAD_SUBDIRS:
        return jsonify({'error': 'Not found'}), 404

    url_path = f'/uploads/{subdir}/{filename}'
    conn = get_db()

    if subdir == 'id_photos':
        tenant = conn.execute(
            "SELECT * FROM users WHERE id_photo_path = ? AND role = 'tenant'", (url_path,)
        ).fetchone()
    else:
        photo = conn.execute(
            'SELECT tenant_id FROM vacate_evidence_photos WHERE file_path = ?', (url_path,)
        ).fetchone()
        tenant = conn.execute(
            "SELECT * FROM users WHERE user_id = ? AND role = 'tenant'", (photo['tenant_id'],)
        ).fetchone() if photo else None

    if not tenant:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    role = session.get('role')
    allowed = (
        role in ('admin', 'landlord')
        or (role == 'tenant' and session.get('user_id') == tenant['user_id'])
        or (role == 'agent' and agent_can_access_tenant(conn, tenant))
    )
    conn.close()

    if not allowed:
        return jsonify({'error': 'Forbidden'}), 403

    return send_from_directory(os.path.join(UPLOAD_DIR, subdir), filename)

app.register_blueprint(auth_bp)
app.register_blueprint(units_bp)
app.register_blueprint(tenants_bp)
app.register_blueprint(properties_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(water_bills_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(invoices_bp)
app.register_blueprint(agreement_bp)
app.register_blueprint(agents_bp)
app.register_blueprint(mpesa_bp)


@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Rental-ACE backend is running'}


def start_invoice_scheduler():
    """Runs once a day and makes sure every active tenant has an invoice for
    the current month, auto-generating any that are missing. Idempotent by
    design (generate_monthly_invoices skips units that already have one), so
    a missed run or a restart mid-month just catches up on the next tick.
    Manual generation (the admin 'Generate Invoice' button / POST /api/invoices)
    keeps working exactly as before — this only fills in what nobody has
    created yet."""
    from apscheduler.schedulers.background import BackgroundScheduler
    from routes.invoices import generate_monthly_invoices

    def run_generation():
        conn = get_db()
        try:
            created = generate_monthly_invoices(conn)
            if created:
                print(f'✅ Auto-generated {len(created)} invoice(s) for this month')
        finally:
            conn.close()

    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(run_generation, 'cron', hour=0, minute=10, id='monthly_invoice_generation')
    scheduler.start()
    return scheduler


if __name__ == '__main__':
    # Werkzeug's debug reloader re-imports this module in a watcher process
    # before forking the real server child — only start the scheduler in the
    # actual serving process so it doesn't run twice.
    if not app.debug or os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        start_invoice_scheduler()
    app.run(debug=True, port=int(os.environ.get('PORT', 5001)))
elif os.environ.get('ENABLE_SCHEDULER') == 'true':
    # Running under a production WSGI server (gunicorn on Render) rather than
    # `python app.py` — the __main__ guard above never runs, so start the
    # scheduler here instead. Only set ENABLE_SCHEDULER on a single-worker
    # deployment, otherwise each worker process starts its own scheduler and
    # invoices get generated multiple times.
    start_invoice_scheduler()
