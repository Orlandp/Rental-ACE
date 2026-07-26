import React, { useState, useEffect } from 'react';
import useIdleLogout from '../../hooks/useIdleLogout';

function TenantDashboard() {

  useIdleLogout(5);
  
  const [tenant, setTenant]     = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const summaryRes = await fetch('http://localhost:5000/api/tenants/me/summary', {
          credentials: 'include',
        });
        const summaryData = await summaryRes.json();
        if (!summaryRes.ok) {
          setError(summaryData.error || 'Could not load your details.');
          return;
        }
        setTenant(summaryData);

        const paymentsRes = await fetch('http://localhost:5000/api/payments', {
          credentials: 'include',
        });
        const paymentsData = await paymentsRes.json();
        if (paymentsRes.ok) setPayments(paymentsData);
      } catch (err) {
        setError('Could not reach the server.');
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
    window.location.href = `/pay?unit=${tenant.unit_number}`;
  }

  function getStatusColor(status) {
    if (status === 'paid')    return '#1a7a4a';
    if (status === 'unpaid')  return '#c0392b';
    if (status === 'penalty') return '#f57c00';
    return '#888';
  }

  function getTotal() {
    if (!tenant) return 0;
    return tenant.total_due;
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
            <h2 style={styles.headerName}>{tenant.full_name}</h2>
            <p style={styles.headerSub}>
              House {tenant.unit_number} · {tenant.property_name}
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

        {tenant.already_paid_this_month ? (
          <div style={{ ...styles.penaltyBadge, backgroundColor: '#e8f5ee', border: '1px solid #b8dfc9', color: '#1a7a4a' }}>
            ✓ Rent for {tenant.current_month} has been paid. You're all clear!
          </div>
        ) : (
          <>
            <div style={styles.balanceRow}>
              <div style={styles.balanceCol}>
                <p style={styles.balanceLabel}>Rent Due</p>
                <p style={styles.balanceValue}>
                  Ksh {tenant.rent_amount.toLocaleString()}
                </p>
              </div>
              <div style={styles.divider} />
              <div style={styles.balanceCol}>
                <p style={styles.balanceLabel}>Penalty</p>
                <p style={{
                  ...styles.balanceValue,
                  color: tenant.penalty > 0 ? '#c0392b' : '#1a7a4a'
                }}>
                  Ksh {tenant.penalty.toLocaleString()}
                </p>
              </div>
              <div style={styles.divider} />
              <div style={styles.balanceCol}>
                <p style={styles.balanceLabel}>Total Due</p>
                <p style={styles.balanceValue}>
                  Ksh {getTotal().toLocaleString()}
                </p>
              </div>
            </div>

            {tenant.penalty > 0 && (
              <div style={styles.penaltyBadge}>
                ⚠ A late penalty of Ksh {tenant.penalty.toLocaleString()} has been added since rent wasn't paid by the 5th.
              </div>
            )}
          </>
        )}
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
        {payments.length === 0 ? (
          <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
            No payments recorded yet.
          </p>
        ) : (
          payments.map((payment) => (
            <div key={payment.payment_id} style={styles.paymentRow}>
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
          ))
        )}
      </div>

    </div>
  );
}

const styles = {
  page: {
    maxWidth: '860px',
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
    padding: '32px 32px 36px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  headerName: {
    fontSize: '26px',
    fontWeight: 700,
    margin: '0 0 4px',
  },
  headerSub: { fontSize: '14px', opacity: 0.8, margin: 0 },
  logoutBtn: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    margin: '20px 24px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  balanceCol: { flex: 1, textAlign: 'center', minWidth: '80px' },
  balanceLabel: {
    fontSize: '11px',
    color: '#888',
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  balanceValue: { fontSize: '18px', fontWeight: 700, margin: 0, color: '#1a1a1a' },
  divider: { width: '1px', height: '48px', backgroundColor: '#f0f0f0' },
  penaltyBadge: {
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#f57c00',
    textAlign: 'center',
    marginTop: '16px',
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
    marginBottom: '20px',
  },
  qrBox: { textAlign: 'center' },
  qrLabel: { fontSize: '14px', color: '#888', margin: '0 0 16px' },
  qrPlaceholder: {
    border: '2px dashed #ddd',
    borderRadius: '16px',
    padding: '40px',
    backgroundColor: '#f9f9f9',
  },
  qrText: { fontSize: '40px', margin: '0 0 10px' },
  qrSub: { fontSize: '13px', color: '#aaa', margin: 0 },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  paymentLeft: { flex: 1 },
  paymentMonth: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
  paymentCode: { fontSize: '12px', color: '#888', margin: 0 },
  paymentRight: { textAlign: 'right' },
  paymentAmount: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
  paymentStatus: { fontSize: '12px', fontWeight: 700, margin: 0 },
};

export default TenantDashboard;