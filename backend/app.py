from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.units import units_bp
from routes.tenant import tenants_bp
from routes.properties import properties_bp
from routes.payments import payments_bp
from routes.expenses import expenses_bp
from routes.messages import messages_bp
from routes.water_bills import water_bills_bp

app = Flask(__name__)
app.secret_key = 'change this to something later'
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

app.register_blueprint(auth_bp)
app.register_blueprint(units_bp)
app.register_blueprint(tenants_bp)
app.register_blueprint(properties_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(water_bills_bp)


@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Rental-ACE backend is running'}


if __name__ == '__main__':
    app.run(debug=True, port=5000)
