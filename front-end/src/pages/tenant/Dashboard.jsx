import React, { useState, useEffect } from 'react';

const mockTenant = {
  name: 'James Orlando',
  phone: '0712000001',
  house: 3,
  property: 'Ace Apartments',
  location: 'Eldoret',
  rent_amount: 18000,
  balance: 4000,
  penalty_date: 5,
  penalty_rate: 5.0,
  penalty_amount: 900,
};

const mockPayments = [
  { id: 1, month: 'July 2026',     amount: 18000, mpesa_code: 'QHX7234KLP', status: 'paid'   },
  { id: 2, month: 'June 2026',     amount: 19800, mpesa_code: 'RKL8923MNP', status: 'paid'   },
  { id: 3, month: 'May 2026',      amount: 18000, mpesa_code: 'PLM3421QRS', status: 'paid'   },
  { id: 4, month: 'April 2026',    amount: 18000, mpesa_code: 'NKJ9821WXY', status: 'paid'   },
  { id: 5, month: 'March 2026',    amount: 18000, mpesa_code: 'MHG4532ABC', status: 'paid'   },
  { id: 6, month: 'February 2026', amount: 18000, mpesa_code: 'LKP2341DEF', status: 'paid'   },
  { id: 7, month: 'January 2026',  amount: 0,     mpesa_code: null,          status: 'unpaid' },
];

function TenantDashboard() {

  const [tenant, setTenant]     = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setTenant(mockTenant);
        setPayments(mockPayments);
      } catch (err) {
        setError('Could not load your details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleLogout() {
    window.location.href = '/login';
  }

  function handlePay() {
    window.location.href = '/pay?property=1';
  }

  function getStatusColor(status) {
    if (status === 'paid')    return '#1a7a4a';
    if (status === 'unpaid')  return '#c0392b';
    if (status === 'penalty') return '#f57c00';
    return '#888';
  }

  function getTotal() {
    if (!tenant) return 0;
    return tenant.rent_amount + tenant.balance + tenant.penalty_amount;
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>⚠ {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.headerLabel}>Tenant</p>
            <h2 style={styles.headerName}>{tenant.name}</h2>
            <p style={styles.headerSub}>
              House {tenant.house} · {tenant.property}
            </p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>Current Balance</p>

        <div style={styles.balanceRow}>
          <div style={styles.balanceCol}>
            <p style={styles.balanceLabel}>Rent Due</p>
            <p style={styles.balanceValue}>
              Ksh {tenant.rent_amount.toLocaleString()}
            </p>
          </div>
          <div style={styles.divider} />
          <div style={styles.balanceCol}>
            <p style={styles.balanceLabel}>Arrears</p>
            <p style={{
              ...styles.balanceValue,
              color: tenant.balance > 0 ? '#c0392b' : '#1a7a4a'
            }}>
              Ksh {tenant.balance.toLocaleString()}
            </p>
          </div>
          <div style={styles.divider} />
          <div style={styles.balanceCol}>
            <p style={styles.balanceLabel}>Total</p>
            <p style={styles.balanceValue}>
              Ksh {getTotal().toLocaleString()}
            </p>
          </div>
        </div>

        {/* Penalty Info */}
        <div style={styles.penaltyBadge}>
          ⚠ Late penalty after {tenant.penalty_date}th
          ({tenant.penalty_rate}% = Ksh {tenant.penalty_amount.toLocaleString()})
        </div>
      </div>

      {/* Pay Now Section */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>Pay Now</p>
        <button onClick={handlePay} style={styles.payBtn}>
          Pay via M-Pesa
        </button>
        <div style={styles.qrBox}>
          <p style={styles.qrLabel}>Or scan QR code</p>
          <div style={styles.qrPlaceholder}>
            <p style={styles.qrText}>📱 QR Code</p>
            <p style={styles.qrSub}>Coming in backend phase</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>Payment History</p>
        {payments.map((payment) => (
          <div key={payment.id} style={styles.paymentRow}>
            <div style={styles.paymentLeft}>
              <p style={styles.paymentMonth}>{payment.month}</p>
              {payment.mpesa_code && (
                <p style={styles.paymentCode}>
                  Code: {payment.mpesa_code}
                </p>
              )}
            </div>
            <div style={styles.paymentRight}>
              <p style={styles.paymentAmount}>
                Ksh {payment.amount.toLocaleString()}
              </p>
              <p style={{
                ...styles.paymentStatus,
                color: getStatusColor(payment.status)
              }}>
                {payment.status.toUpperCase()}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  page: {
    maxWidth: '420px',
    margin: '0 auto',
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  errorText: { color: '#c0392b', fontSize: '15px', textAlign: 'center' },
  header: {
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '28px 20px 32px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  headerName: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 4px',
  },
  headerSub: { fontSize: '13px', opacity: 0.8, margin: 0 },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    margin: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  balanceCol: { flex: 1, textAlign: 'center' },
  balanceLabel: { fontSize: '11px', color: '#888', margin: '0 0 4px', textTransform: 'uppercase' },
  balanceValue: { fontSize: '16px', fontWeight: 700, margin: 0, color: '#1a1a1a' },
  divider: { width: '1px', height: '40px', backgroundColor: '#f0f0f0' },
  penaltyBadge: {
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#f57c00',
    textAlign: 'center',
    marginTop: '12px',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '16px',
  },
  qrBox: { textAlign: 'center' },
  qrLabel: { fontSize: '13px', color: '#888', margin: '0 0 12px' },
  qrPlaceholder: {
    border: '2px dashed #ddd',
    borderRadius: '12px',
    padding: '30px',
    backgroundColor: '#f9f9f9',
  },
  qrText: { fontSize: '32px', margin: '0 0 8px' },
  qrSub: { fontSize: '12px', color: '#aaa', margin: 0 },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  paymentLeft: { flex: 1 },
  paymentMonth: { fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
  paymentCode: { fontSize: '11px', color: '#888', margin: 0 },
  paymentRight: { textAlign: 'right' },
  paymentAmount: { fontSize: '14px', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
  paymentStatus: { fontSize: '11px', fontWeight: 700, margin: 0 },
};

export default TenantDashboard;