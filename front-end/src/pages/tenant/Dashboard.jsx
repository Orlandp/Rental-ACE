import React, { useState, useEffect } from 'react';
import useIdleLogout from '../../hooks/useIdleLogout';
import useBackButtonLogout from '../../hooks/useBackButtonLogout';
import AgreementGate from './AgreementGate';

function TenantDashboard() {

  useIdleLogout(5);
  useBackButtonLogout();
  
  const [tenant, setTenant]     = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const summaryRes = await fetch('http://localhost:5001/api/tenants/me/summary', {
          credentials: 'include',
        });
        const summaryData = await summaryRes.json();
        if (!summaryRes.ok) {
          setError(summaryData.error || 'Could not load your details.');
          return;
        }
        setTenant(summaryData);

        const paymentsRes = await fetch('http://localhost:5001/api/payments', {
          credentials: 'include',
        });
        const paymentsData = await paymentsRes.json();
        if (paymentsRes.ok) setPayments(paymentsData);

        const invoicesRes = await fetch('http://localhost:5001/api/invoices', {
          credentials: 'include',
        });
        const invoicesData = await invoicesRes.json();
        if (invoicesRes.ok) setInvoices(invoicesData);
      } catch (err) {
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleLogout() {
    fetch('http://localhost:5001/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      window.location.href = '/login';
    });
  }

  function handlePay() {
    window.location.href = `/pay?unit=${tenant.unit_number}`;
  }

  async function handleDownloadReceipt(paymentId) {
    try {
      const res = await fetch(`http://localhost:5001/api/payments/${paymentId}/receipt/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate receipt PDF.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-RCT-${String(paymentId).padStart(5, '0')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadInvoiceReceipt(invoiceId) {
    try {
      const res = await fetch(`http://localhost:5001/api/invoices/${invoiceId}/receipt/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate receipt PDF.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rent-receipt-INV-${String(invoiceId).padStart(5, '0')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadAgreement() {
    try {
      const res = await fetch('http://localhost:5001/api/tenants/me/agreement/pdf', {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate the agreement PDF.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenancy-agreement-house-${tenant.unit_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadDepositReceipt() {
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.user_id}/deposit-receipt/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate deposit receipt PDF.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deposit-receipt-DEP-${String(tenant.user_id).padStart(5, '0')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function getStatusColor(status) {
    if (status === 'paid')    return 'var(--color-primary)';
    if (status === 'unpaid')  return 'var(--color-danger)';
    if (status === 'partial') return 'var(--color-warning)';
    if (status === 'penalty') return 'var(--color-warning)';
    return 'var(--color-muted)';
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

  if (!tenant.agreement_signed) {
    return <AgreementGate />;
  }

  if (tenant.id_photo_requested) {
    return <AgreementGate photoOnly />;
  }

  if (!tenant.deposit_paid) {
    return (
      <div style={styles.centered}>
        <div style={styles.pendingCard}>
          <p style={styles.pendingIcon}>⏳</p>
          <h2 style={styles.pendingTitle}>Almost there</h2>
          <p style={styles.pendingText}>
            Your deposit payment is pending admin confirmation. Once the office
            has recorded your deposit, you'll get full access to your dashboard.
          </p>
          <button onClick={handleLogout} style={styles.pendingLogoutBtn} className="btn-lift">
            Logout
          </button>
        </div>
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
          <button onClick={handleLogout} style={styles.logoutBtn} className="btn-lift">
            Logout
          </button>
        </div>
      </div>

      {/* Documents Card */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>My Documents</p>
        <button onClick={handleDownloadAgreement} style={styles.receiptBtn} className="btn-lift">
          📄 Download Tenancy Agreement
        </button>
        <button onClick={handleDownloadDepositReceipt} style={{ ...styles.receiptBtn, marginTop: '10px' }} className="btn-lift">
          📄 Download Deposit Receipt
        </button>
      </div>

      {/* Balance Card */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>Current Balance</p>

        {tenant.already_paid_this_month ? (
          <div style={{ ...styles.penaltyBadge, backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-soft)', color: 'var(--color-primary-dark)' }}>
            ✓ You have no outstanding balance right now. You're all clear!
          </div>
        ) : (
          <>
            {tenant.invoice_status === 'partial' && (
              <div style={{ ...styles.penaltyBadge, backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-soft)', color: 'var(--color-primary-dark)', marginBottom: '16px', marginTop: 0 }}>
                You've paid Ksh {tenant.amount_paid_on_invoice.toLocaleString()} towards {tenant.current_month} so far.
              </div>
            )}
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
                  color: tenant.penalty > 0 ? 'var(--color-danger)' : 'var(--color-primary)'
                }}>
                  Ksh {tenant.penalty.toLocaleString()}
                </p>
              </div>
              <div style={styles.divider} />
              <div style={styles.balanceCol}>
                <p style={styles.balanceLabel}>Balance Due</p>
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
        <button onClick={handlePay} style={styles.payBtn} className="btn-lift">
          Pay via M-Pesa
        </button>
      </div>

      {/* My Invoices */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>My Invoices</p>
        {invoices.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
            No invoices yet.
          </p>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.invoice_id} style={styles.paymentRow}>
              <div style={styles.paymentLeft}>
                <p style={styles.paymentMonth}>{invoice.invoice_no} · {invoice.month}</p>
                <p style={styles.paymentCode}>
                  Due {invoice.due_date}
                  {invoice.water_amount > 0 ? ` · Water Ksh ${invoice.water_amount.toLocaleString()}` : ''}
                  {invoice.penalty > 0 ? ` · Penalty Ksh ${invoice.penalty.toLocaleString()}` : ''}
                  {invoice.status === 'partial' ? ` · Paid Ksh ${invoice.amount_paid.toLocaleString()} of ${invoice.total_amount.toLocaleString()}` : ''}
                </p>
              </div>
              <div style={styles.paymentRightGroup}>
                <div style={styles.paymentRight}>
                  <p style={styles.paymentAmount}>
                    {invoice.status === 'partial'
                      ? `Ksh ${invoice.balance_due.toLocaleString()} due`
                      : `Ksh ${invoice.total_amount.toLocaleString()}`}
                  </p>
                  <p style={{
                    ...styles.paymentStatus,
                    color: getStatusColor(invoice.status)
                  }}>
                    {invoice.status.toUpperCase()}
                  </p>
                </div>
                {(invoice.status === 'paid' || invoice.status === 'partial') && invoice.amount_paid > 0 && (
                  <button
                    onClick={() => handleDownloadInvoiceReceipt(invoice.invoice_id)}
                    style={styles.receiptBtn}
                    className="btn-lift"
                  >
                    📄 Receipt
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment History */}
      <div style={styles.card}>
        <p style={styles.cardTitle}>Payment History</p>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
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
              <div style={styles.paymentRightGroup}>
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
                {payment.status === 'paid' && (
                  <button
                    onClick={() => handleDownloadReceipt(payment.payment_id)}
                    style={styles.receiptBtn}
                    className="btn-lift"
                  >
                    📄 Receipt
                  </button>
                )}
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
    backgroundColor: 'var(--color-bg)',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  pendingCard: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 32px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
    margin: '0 16px',
    boxSizing: 'border-box',
  },
  pendingIcon: { fontSize: '40px', margin: '0 0 16px' },
  pendingTitle: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', margin: '0 0 12px' },
  pendingText: { fontSize: '14px', color: 'var(--color-ink-soft)', lineHeight: 1.6, margin: '0 0 28px' },
  pendingLogoutBtn: {
    padding: '12px 28px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-primary)',
    border: '2px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: 700,
  },
  loadingText: { color: 'var(--color-muted)', fontSize: '15px' },
  errorText: { color: 'var(--color-danger)', fontSize: '15px', textAlign: 'center' },
  header: {
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    color: 'var(--color-text-on-brand)',
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
    fontFamily: 'var(--font-display)',
    fontSize: '27px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: '0 0 4px',
  },
  headerSub: { fontSize: '14px', opacity: 0.85, margin: 0 },
  logoutBtn: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-on-brand)',
    fontSize: '14px',
    fontWeight: 600,
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    margin: '20px 24px',
    padding: '28px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
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
    color: 'var(--color-muted)',
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  balanceValue: { fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-ink)' },
  divider: { width: '1px', height: '48px', backgroundColor: 'var(--color-border)' },
  penaltyBadge: {
    background: 'var(--color-warning-light)',
    border: '1px solid var(--color-warning-strong)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--color-warning)',
    textAlign: 'center',
    marginTop: '16px',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '20px',
    boxShadow: '0 6px 16px rgba(22, 121, 74, 0.28)',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid var(--color-border)',
  },
  paymentLeft: { flex: 1 },
  paymentMonth: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: 'var(--color-ink)' },
  paymentCode: { fontSize: '12px', color: 'var(--color-muted)', margin: 0 },
  paymentRight: { textAlign: 'right' },
  paymentAmount: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: 'var(--color-ink)' },
  paymentStatus: { fontSize: '12px', fontWeight: 700, margin: 0 },
  paymentRightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  receiptBtn: {
    padding: '8px 14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-primary)',
    border: '1.5px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};

export default TenantDashboard;