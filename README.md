# Rental-ACE

A rental property management system for landlords/admins to manage properties, units, tenants, rent
collection, and tenant onboarding — with a self-service portal for tenants to sign in, view what they
owe, and pay rent.

**Stack:** Flask + SQLite (backend) · React (frontend, Create React App) · ReportLab / openpyxl for PDF
and Excel exports.

---

## Features (MVP)

### Accounts & roles
- Three roles: **tenant**, **landlord**, **admin**. Landlord/admin registration requires a shared secret
  code; tenant registration does not.
- New accounts are `pending` until an admin/landlord approves them (tenants are approved into a specific
  unit).
- Session-based login (Flask session cookie), idle auto-logout on the dashboards.

### Properties & units
- Multiple properties, each with its own M-Pesa paybill/account details.
- Units per property: rent amount, payment type (paybill or a unit-specific phone number), penalty
  terms, optional water billing, and a deposit amount (defaults to one month's rent).
- Admin can edit or delete units (deletion blocked while a unit has an active tenant).

### Tenant onboarding: agreement + deposit
- One shared, admin-editable tenancy agreement template.
- A tenant must **click "I Agree"** (details — unit, rent, deposit, penalty terms — are pulled live, not
  hardcoded) **and** have their deposit **marked paid by admin** before they can access their dashboard.
  Signed-but-unpaid shows a "waiting on deposit confirmation" screen instead.
- Downloadable PDF of the signed agreement and a deposit receipt PDF, both from the tenant's own
  dashboard.

### Invoicing
- Admin generates a monthly invoice per tenant (rent + water + penalty), each with a formatted
  invoice number.
- Late penalties (grace period, then two escalating tiers) are recalculated live on every read/payment,
  not frozen at generation time — so an invoice generated early still picks up the correct penalty if the
  tenant ends up paying late.
- **Partial payments**: an invoice can be paid in installments; it tracks `amount_paid`/balance and moves
  through `unpaid → partial → paid`.
- **Advance payments**: if a payment covers more than what's currently owed, the system auto-generates
  and settles future months' invoices with the overflow, so a multi-month payment is still attributed
  month-by-month rather than left as an untracked lump sum.

### Payments & receipts
- Tenant self-service payment (simulated M-Pesa STK push) from a public QR-code-friendly pay page —
  charges against the tenant's actual outstanding invoice.
- Admin/landlord manual payment entry for cash, bank transfer, or phone-based M-Pesa (for units not on
  the shared paybill), which won't come through any automated channel.
- Every payment produces a PDF receipt (receipt number, invoice(s) covered, M-Pesa code), downloadable
  by admin, or by the tenant from their own dashboard.

### Water billing
- Per-unit, opt-in water billing with its own monthly history, dynamically listing whichever units have
  it enabled (not hardcoded to specific unit numbers).

### Expenses & reports
- Categorized expense tracking per property.
- Monthly financial reports (expected vs. collected income, outstanding, expenses, per-unit breakdown) as
  PDF or Excel download.

### Messaging
- SMS-style tenant notifications (payment confirmations, invoice-ready notices, custom messages),
  logged to a message history — simulated, no real SMS gateway wired up.

### Vacating a tenant
- Vacating shows a confirmation with the real deposit settlement first: outstanding rent (auto-voided),
  itemized deductions you can add (e.g. damage, with up to 3 evidence photos), and the resulting
  refund-due or amount-still-owed.
- **Undo Vacate** restores the tenant to active status and their unit (if it hasn't been re-let since),
  restoring any voided invoices.
- A vacate settlement PDF receipt documents the whole breakdown.

---

## Project structure

```
backend/
  app.py                 Flask app, blueprint registration
  database.py             SQLite schema + migrations + seed data
  routes/
    auth.py                register / login / session
    properties.py           properties + units
    units.py                 unit detail, public pay-page lookup
    tenant.py                tenant CRUD, approve/vacate/unvacate, agreement, deposit
    agreement.py             tenancy agreement template + signing + PDF
    invoices.py               invoice generation, penalty refresh, allocation helpers
    payments.py                self-pay, manual entry, receipt PDF
    water_bills.py              per-unit water billing
    expenses.py                  property expenses
    messages.py                   SMS-simulation log
    reports.py                     PDF / Excel financial reports
    decorators.py                  login_required / role_required

front-end/src/pages/
  LoginPage.jsx, RegisterPage.jsx, PayPage.jsx, SuccessPage.jsx
  admin/Dashboard.jsx        full admin/landlord-management console
  landlord/Dashboard.jsx      lighter read-mostly landlord view
  tenant/Dashboard.jsx          tenant self-service portal
  tenant/AgreementGate.jsx       tenancy agreement sign-off screen
```

## Getting started

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 -c "from database import init_db; init_db()"   # creates rental.db + seed data
python3 app.py                                          # runs on http://localhost:5000
```

### Frontend
```bash
cd front-end
npm install
npm start                                                # runs on http://localhost:3000
```

The frontend calls the backend at `http://localhost:5000` directly (CORS is configured for
`http://localhost:3000`); both need to be running.

### Seed accounts
- Admin: `admin1` / `admin123`
- Landlord: `landlord1` / `landlord123`
- Registration secret codes (in `backend/routes/auth.py`): `admin2026`, `landlord2026`

---

## Known limitations (pre-production)

- Secret registration codes and the Flask session secret are hardcoded in source — must move to
  environment variables/config before any real deployment.
- M-Pesa payment is **simulated** (a fake code is generated on "payment") — no Daraja API integration.
- SMS notifications are logged to a database table, not actually sent — no real SMS gateway.
- QR Codes admin tab is a placeholder, not implemented.
- Single Flask secret key / SQLite file — fine for a demo, not for concurrent production load.

## Suggested next features for a fuller MVP

- Real M-Pesa Daraja (STK push + payment callback) integration, especially for paybill units.
- Real SMS/WhatsApp delivery for tenant notifications.
- Maintenance/repair request tracking (tenant-submitted, admin-tracked).
- Lease end-date / renewal reminders (current agreement is open-ended, month-to-month).
- Multi-admin audit log (who generated/edited/deleted what).
- Tenant-side agreement re-download and payment plan visibility for partial invoices.
- Role-based property scoping (a landlord who should only see their own property, not all properties).
