import os
import re
import psycopg2
import psycopg2.extras
from werkzeug.security import generate_password_hash, check_password_hash

from datetime import datetime


DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'postgresql://rental_ace:rental_ace_dev@localhost:5432/rental_ace'
)

# table -> primary key column, used to emulate sqlite3's cursor.lastrowid by
# auto-appending a RETURNING clause to INSERT statements
TABLE_PRIMARY_KEYS = {
    'properties': 'property_id',
    'units': 'unit_id',
    'users': 'user_id',
    'payments': 'payment_id',
    'expenses': 'expense_id',
    'water_bills': 'bill_id',
    'invoices': 'invoice_id',
    'messages': 'message_id',
    'agreement_template': 'id',
    'payment_allocations': 'allocation_id',
    'deposit_deductions': 'deduction_id',
    'vacate_evidence_photos': 'photo_id',
}

_INSERT_TABLE_RE = re.compile(r'^\s*INSERT\s+INTO\s+(\w+)', re.IGNORECASE)


class CompatCursor:
    """Wraps a psycopg2 cursor so route code written against sqlite3's
    cursor API (fetchone/fetchall/lastrowid) needs no changes."""

    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()


class CompatConnection:
    """Wraps a psycopg2 connection to provide sqlite3.Connection's
    `.execute()` convenience method (no explicit cursor object needed),
    `?` placeholders, dict-and-index row access (via DictCursor, matching
    sqlite3.Row's dual API), and `.lastrowid` support on INSERT (via an
    auto-appended RETURNING clause) — so the whole route layer, originally
    written against sqlite3, works unchanged against PostgreSQL.
    """

    def __init__(self, pg_conn):
        self._conn = pg_conn

    def execute(self, query, params=()):
        translated = query.replace('?', '%s')

        match = _INSERT_TABLE_RE.match(translated)
        table = match.group(1) if match else None
        pk_col = TABLE_PRIMARY_KEYS.get(table)
        if pk_col and 'RETURNING' not in translated.upper():
            translated = translated.rstrip().rstrip(';') + f' RETURNING {pk_col}'

        cur = self._conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(translated, params)

        wrapped = CompatCursor(cur)
        if pk_col:
            row = cur.fetchone()
            if row:
                wrapped.lastrowid = row[0]
        return wrapped

    def executemany(self, query, seq_of_params):
        translated = query.replace('?', '%s')
        cur = self._conn.cursor()
        cur.executemany(translated, seq_of_params)
        return CompatCursor(cur)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


def get_db():
    pg_conn = psycopg2.connect(DATABASE_URL)
    return CompatConnection(pg_conn)


def get_columns(conn, table_name):
    cur = conn.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = ?",
        (table_name,)
    )
    return [row['column_name'] for row in cur.fetchall()]


def init_db():
    conn = get_db()

    conn.execute('''
    CREATE TABLE IF NOT EXISTS properties (
                 property_id SERIAL PRIMARY KEY,
                 name      TEXT NOT NULL,
                 location TEXT NOT NULL,
                 paybill_no TEXT,
                 account_no TEXT NOT NULL,
                 created_at TEXT
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS units (
                  unit_id SERIAL PRIMARY KEY,
                  property_id INTEGER NOT NULL,
                  unit_number INTEGER NOT NULL,
                  rent_amount REAL NOT NULL,
                  payment_type TEXT NOT NULL,
                  phone_no TEXT,
                  has_water_bill INTEGER DEFAULT 0,
                  water_bill REAL DEFAULT 0,
                  penalty_date INTEGER DEFAULT 5,
                  penalty_rate REAL DEFAULT 5.0,
                  status TEXT DEFAULT 'AVAILABLE',
                  FOREIGN KEY(property_id) REFERENCES properties(property_id)
                  )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS users (
                 user_id SERIAL PRIMARY KEY,
                 full_name TEXT NOT NULL,
                 username TEXT NOT NULL UNIQUE,
                 phone TEXT NOT NULL,
                 id_number TEXT,
                 role TEXT NOT NULL,
                 password TEXT NOT NULL,
                 unit_id INTEGER,
                 status TEXT DEFAULT 'pending',
                 created_at TEXT NOT NULL,
                 FOREIGN KEY(unit_id) REFERENCES units(unit_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS payments (
                 payment_id SERIAL PRIMARY KEY,
                 tenant_id INTEGER NOT NULL,
                 unit_id INTEGER NOT NULL,
                 amount REAL NOT NULL,
                 mpesa_code TEXT,
                 phone_used TEXT NOT NULL,
                 payment_date TEXT NOT NULL,
                 month TEXT NOT NULL,
                 status TEXT DEFAULT 'paid',
                 FOREIGN KEY(tenant_id) REFERENCES users(user_id),
                 FOREIGN KEY(unit_id) REFERENCES units(unit_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS expenses (
                 expense_id SERIAL PRIMARY KEY,
                 property_id INTEGER NOT NULL,
                 category TEXT NOT NULL,
                 description TEXT NOT NULL,
                 amount INTEGER,
                 expense_date TEXT,
                 FOREIGN KEY(property_id) REFERENCES properties(property_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS water_bills (
                 bill_id SERIAL PRIMARY KEY,
                 unit_id INTEGER NOT NULL,
                 amount REAL NOT NULL,
                 month TEXT NOT NULL,
                 year INTEGER NOT NULL,
                 FOREIGN KEY(unit_id) REFERENCES units(unit_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS invoices (
                 invoice_id SERIAL PRIMARY KEY,
                 tenant_id INTEGER NOT NULL,
                 unit_id INTEGER NOT NULL,
                 month TEXT NOT NULL,
                 rent_amount REAL NOT NULL,
                 water_amount REAL DEFAULT 0,
                 penalty REAL DEFAULT 0,
                 total_amount REAL NOT NULL,
                 due_date TEXT NOT NULL,
                 status TEXT DEFAULT 'unpaid',
                 payment_id INTEGER,
                 created_at TEXT NOT NULL,
                 paid_at TEXT,
                 FOREIGN KEY(tenant_id) REFERENCES users(user_id),
                 FOREIGN KEY(unit_id) REFERENCES units(unit_id),
                 FOREIGN KEY(payment_id) REFERENCES payments(payment_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS messages (
                 message_id SERIAL PRIMARY KEY,
                 recipient TEXT NOT NULL,
                 content TEXT NOT NULL,
                 sent_at TEXT NOT NULL,
                 status TEXT DEFAULT 'sent'
                 )
''')
    conn.commit()
    seed_data(conn)
    run_migrations(conn)
    conn.close()
    print('✅ Database ready!')


DEFAULT_AGREEMENT_TEXT = """TENANCY AGREEMENT — ACE APARTMENTS

This Tenancy Agreement is entered into between Ace Apartments ("the Landlord") \
and the Tenant named on their account, for the residential unit assigned to them \
at Ace Apartments, Eldoret.

1. TERM
   This agreement is on a month-to-month basis and remains in effect while the \
   Tenant occupies the unit.

2. RENT
   Rent is due in full on or before the 1st day of each month. Rent amounts and \
   payment instructions are specific to the Tenant's assigned unit.

3. LATE PAYMENT PENALTIES
   Rent not paid by the 5th of the month attracts a 5% penalty. Rent still unpaid \
   after the 10th of the month attracts a 10% penalty, calculated on the base rent \
   amount.

4. SECURITY DEPOSIT
   A refundable security deposit, equal to one month's rent unless otherwise \
   stated, is payable before move-in and is recorded by management upon receipt. \
   The deposit is refundable at the end of the tenancy, less any deductions for \
   damages beyond normal wear and tear or outstanding balances.

5. CONDUCT AND MAINTENANCE
   The Tenant agrees to keep the unit in good condition, report maintenance issues \
   promptly, and avoid activities that disturb other tenants or damage the property.

6. TERMINATION
   Either party may terminate this agreement with 30 days' written notice.

By clicking "I Agree", the Tenant acknowledges they have read, understood, and \
accepted the terms of this Tenancy Agreement.
"""


def run_migrations(conn):
    user_cols = get_columns(conn, 'users')
    if 'agreement_signed' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN agreement_signed INTEGER DEFAULT 0')
    if 'agreement_signed_at' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN agreement_signed_at TEXT')
    if 'deposit_paid' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN deposit_paid INTEGER DEFAULT 0')
    if 'deposit_paid_at' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN deposit_paid_at TEXT')
    if 'deposit_amount_paid' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN deposit_amount_paid REAL')
    if 'vacated_at' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN vacated_at TEXT')
    if 'id_photo_path' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN id_photo_path TEXT')
    if 'assigned_property_id' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN assigned_property_id INTEGER REFERENCES properties(property_id)')
    if 'id_photo_verified' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN id_photo_verified INTEGER DEFAULT 0')
    if 'id_photo_verified_at' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN id_photo_verified_at TEXT')
    if 'id_photo_requested' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN id_photo_requested INTEGER DEFAULT 0')
    if 'password_reset_requested' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN password_reset_requested INTEGER DEFAULT 0')
    if 'password_reset_requested_at' not in user_cols:
        conn.execute('ALTER TABLE users ADD COLUMN password_reset_requested_at TEXT')

    unit_cols = get_columns(conn, 'units')
    if 'deposit_amount' not in unit_cols:
        conn.execute('ALTER TABLE units ADD COLUMN deposit_amount REAL DEFAULT 0')
        conn.execute('UPDATE units SET deposit_amount = rent_amount WHERE deposit_amount = 0')
    if 'paybill_no' not in unit_cols:
        conn.execute('ALTER TABLE units ADD COLUMN paybill_no TEXT')
    if 'account_no' not in unit_cols:
        conn.execute('ALTER TABLE units ADD COLUMN account_no TEXT')

    # every unit now pays via paybill + account number — the old "send to a
    # personal phone" option is gone, so fold any existing phone-type units
    # over to paybill (they already fall back to the property's paybill via
    # COALESCE if they have no override of their own)
    conn.execute("UPDATE units SET payment_type = 'paybill', phone_no = NULL WHERE payment_type != 'paybill'")

    water_bill_cols = get_columns(conn, 'water_bills')
    if 'tenant_id' not in water_bill_cols:
        conn.execute('ALTER TABLE water_bills ADD COLUMN tenant_id INTEGER REFERENCES users(user_id)')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS agreement_template (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            updated_at TEXT
        )
    ''')

    existing = conn.execute('SELECT COUNT(*) FROM agreement_template').fetchone()[0]
    if existing == 0:
        conn.execute(
            'INSERT INTO agreement_template (content, updated_at) VALUES (?, ?)',
            (DEFAULT_AGREEMENT_TEXT, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        )

    invoice_cols = get_columns(conn, 'invoices')
    if 'amount_paid' not in invoice_cols:
        conn.execute('ALTER TABLE invoices ADD COLUMN amount_paid REAL DEFAULT 0')
        conn.execute("UPDATE invoices SET amount_paid = total_amount WHERE status = 'paid'")
    if 'penalty_exempt' not in invoice_cols:
        conn.execute('ALTER TABLE invoices ADD COLUMN penalty_exempt INTEGER DEFAULT 0')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS payment_allocations (
            allocation_id SERIAL PRIMARY KEY,
            payment_id INTEGER NOT NULL,
            invoice_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(payment_id) REFERENCES payments(payment_id),
            FOREIGN KEY(invoice_id) REFERENCES invoices(invoice_id)
        )
    ''')

    existing_allocations = conn.execute('SELECT COUNT(*) FROM payment_allocations').fetchone()[0]
    if existing_allocations == 0:
        already_paid_invoices = conn.execute('''
            SELECT invoice_id, payment_id, total_amount, created_at
            FROM invoices WHERE status = 'paid' AND payment_id IS NOT NULL
        ''').fetchall()
        for inv in already_paid_invoices:
            conn.execute('''
                INSERT INTO payment_allocations (payment_id, invoice_id, amount, created_at)
                VALUES (?, ?, ?, ?)
            ''', (inv['payment_id'], inv['invoice_id'], inv['total_amount'], inv['created_at']))

    conn.execute('''
        CREATE TABLE IF NOT EXISTS deposit_deductions (
            deduction_id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            amount REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES users(user_id)
        )
    ''')

    conn.execute('''
        CREATE TABLE IF NOT EXISTS vacate_evidence_photos (
            photo_id SERIAL PRIMARY KEY,
            tenant_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES users(user_id)
        )
    ''')

    conn.commit()


def seed_data(conn):
    existing = conn.execute(
        'SELECT COUNT(*) FROM properties'
    ).fetchone()[0]

    if existing > 0:
        print('✅ Data already seeded')
        return

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn.execute('''
        INSERT INTO properties
        (name, location, paybill_no, account_no, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', ('Ace Apartments', 'Eldoret', '4567', '9876543210', now))

    units = [
        (1, 1, 12000, 'paybill', None,         0, 0,    5,  5.0),
        (1, 2, 15000, 'paybill', None,         0, 0,    5,  5.0),
        (1, 3, 18000, 'paybill', None,         0, 0,    5,  5.0),
        (1, 4, 20000, 'paybill', None,         0, 0,    10, 8.0),
        (1, 5, 22000, 'paybill', None,         0, 0,    10, 8.0),
        (1, 6, 25000, 'paybill', None,         0, 0,    5,  5.0),
        (1, 7, 28000, 'phone',   '0722223432', 1, 1200, 5,  5.0),
        (1, 8, 28000, 'phone',   '0722223433', 1, 980,  10, 8.0),
        (1, 9, 28000, 'phone',   '0722223434', 0, 0,    5,  5.0),
    ]

    conn.executemany('''
        INSERT INTO units
        (property_id, unit_number, rent_amount, payment_type,
         phone_no, has_water_bill, water_bill, penalty_date, penalty_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', units)

    admins = [
        ('James Orlando', 'admin1',    '0712000002', 'ADM001', generate_password_hash('admin123'),    'admin',    now),
        ('Chris Nyaware', 'landlord1', '0712000003', 'LND001', generate_password_hash('landlord123'), 'landlord', now),
    ]

    for a in admins:
        conn.execute('''
            INSERT INTO users
            (full_name, username, phone, id_number, password, role, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
        ''', a)

    conn.commit()
    print('✅ Seed data inserted!')


if __name__ == '__main__':
    init_db()
