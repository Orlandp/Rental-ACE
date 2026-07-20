import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

from datetime import datetime


def get_db():
    conn = sqlite3.connect('rental.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    conn.execute('''
    CREATE TABLE IF NOT EXISTS properties (
                 property_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name      TEXT NOT NULL,
                 location TEXT NOT NULL,
                 paybill_no TEXT,
                 account_no TEXT NOT NULL,
                 created_at TEXT
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS units (
                  unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                 user_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                 payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                 expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 property_id INTEGER NOT NULL,
                 category TEXT NOT NULL,
                 description TEXT NOT NULL,
                 amount INTEGER,
                 expense_date INTEGER,
                 FOREIGN KEY(property_id) REFERENCES properties(property_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS water_bills (
                 bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 unit_id INTEGER NOT NULL,
                 amount REAL NOT NULL,
                 month TEXT NOT NULL,
                 year INTEGER NOT NULL,
                 FOREIGN KEY(unit_id) REFERENCES units(unit_id)
                 )
''')
    conn.execute('''
    CREATE TABLE IF NOT EXISTS messages (
                 message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 recipient TEXT NOT NULL,
                 content TEXT NOT NULL,
                 sent_at TEXT NOT NULL,
                 status TEXT DEFAULT 'sent'
                 )
''')
    conn.commit()
    seed_data(conn)
    conn.close()
    print('✅ Database ready!')


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