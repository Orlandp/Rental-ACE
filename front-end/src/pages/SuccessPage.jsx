import React, { useState, useEffect} from 'react';

function SuccessPage() {

     const params = new URLSearchParams(window.location.search);
     const receiptNo = params.get('receipt') || '';
     const paymentId = params.get('payment_id') || '';
     const invoiceNo = params.get('invoice_no') || '';
     const unit = params.get('unit') || '';
     const tenant = params.get('tenant') || '';
     const amount = params.get('amount') || '';
     const rent = params.get('rent') || '';
     const penalty = params.get('penalty') || '';
     const balanceRemaining = params.get('balance_remaining') || '';
     const mpesaCode = params.get('mpesa') || 'pending confirmation';
     const month = params.get('month') || '';
     const date = params.get('date') || '';

     const [countdown, setCountdown] = useState(10);

     useEffect (() => {
        const timer = setInterval(()=> {
            setCountdown ((prev) => {
                if (prev <= 1){
                    clearInterval(timer);
                    window.location.href = '/pay?unit=' + unit;
                    return 0;
                }
                return prev -1;
            });
     },1000);
     return () => clearInterval(timer);
     }, [unit]);

     async function handleDownloadReceipt() {
        try {
            const codeParam = mpesaCode && mpesaCode !== 'pending confirmation'
                ? `?code=${encodeURIComponent(mpesaCode)}`
                : '';
            const res = await fetch(`http://localhost:5001/api/payments/${paymentId}/receipt/pdf${codeParam}`, {
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
            a.download = `receipt-${receiptNo}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Could not reach the server.');
        }
     }

     return (
        <div style={styles.page}>
            <div style={styles.card} className="card-lift">
                <div style={styles.iconCircle}>✓</div>
                <h2 style={styles.title}>Payment Confirmed</h2>
                <p style={styles.subtitle}>
                    Your payment has been received and recorded.
                </p>
                <div style={styles.detailCard}>
                    {receiptNo && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Receipt No</p>
                            <p style={styles.detailValue}>{receiptNo}</p>
                        </div>
                    )}
                    {invoiceNo && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Invoice No</p>
                            <p style={styles.detailValue}>{invoiceNo}</p>
                        </div>
                    )}
                    {tenant && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Tenant</p>
                            <p style={styles.detailValue}>{tenant}</p>
                        </div>
                    )}
                    {unit && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>House</p>
                            <p style={styles.detailValue}>House {unit}</p>
                        </div>
                    )}
                    {month && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>For Month</p>
                            <p style={styles.detailValue}>{month}</p>
                        </div>
                    )}
                    {rent && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Rent Amount</p>
                            <p style={styles.detailValue}>
                                Ksh {parseInt(rent).toLocaleString()}
                            </p>
                        </div>
                    )}
                    {penalty && parseInt(penalty) > 0 && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Late Penalty</p>
                            <p style={{ ...styles.detailValue, color: 'var(--color-danger)' }}>
                                Ksh {parseInt(penalty).toLocaleString()}
                            </p>
                        </div>
                    )}
                    {amount && (
                        <div style={styles.detailRow}>
                            <p style={{ ...styles.detailLabel, fontWeight: 700, color: 'var(--color-ink)' }}>Amount Paid</p>
                            <p style={{ ...styles.detailValue, fontSize: '16px', color: 'var(--color-primary)' }}>
                                Ksh {parseInt(amount).toLocaleString()}
                            </p>
                        </div>
                    )}
                    {balanceRemaining && parseFloat(balanceRemaining) > 0 && (
                        <div style={styles.detailRow}>
                            <p style={{ ...styles.detailLabel, fontWeight: 700, color: 'var(--color-danger)' }}>Still Owed</p>
                            <p style={{ ...styles.detailValue, fontSize: '16px', color: 'var(--color-danger)' }}>
                                Ksh {parseFloat(balanceRemaining).toLocaleString()}
                            </p>
                        </div>
                    )}
                    {date && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Date</p>
                            <p style={styles.detailValue}>{date}</p>
                        </div>
                    )}
                    <div style={styles.detailRow}>
                        <p style={styles.detailLabel}>Mpesa code</p>
                        <p style={{...styles.detailValue, fontSize:'12px', fontWeight: 700, margin: 0, color: 'var(--color-info)'}}>
                          {mpesaCode}
                        </p>
                    </div>
                    <div style={{ ...styles.detailRow, borderBottom: 'none' }}>
                        <p style={styles.detailLabel}>Status</p>
                        <p style={{...styles.detailValue, color:'var(--color-primary)'}}>
                            Confirmed, Received
                        </p>
                    </div>
                </div>
                <div style={styles.messages}>
                    A WhatsApp confirmation has been sent to your phone.
                </div>
                {paymentId && (
                    <button
                      onClick={handleDownloadReceipt}
                      style={styles.receiptBtn}
                      className="btn-lift"
                    >
                        📄 Download Receipt (PDF)
                    </button>
                )}
                <button
                  onClick={() => window.location.href = '/pay?unit=' + unit}
                  style={styles.backBtn}
                  className="btn-lift"
                >
                    {balanceRemaining && parseFloat(balanceRemaining) > 0 ? 'Pay Remaining Balance' : 'Make Another Payment'}
                </button>
                <button
                    onClick={() => window.location.href = '/login'}
                    style={styles.loginBtn}
                    className="btn-lift"
                >
                    View Payment History
                </button>
                <p style={styles.countdown}>
                    Redirecting in {countdown} seconds...
                </p>
            </div>
        </div>

     );

}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 0%, var(--color-primary-soft-2) 0%, var(--color-bg) 45%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
    textAlign: 'center',
    boxSizing: 'border-box',
    animation: 'fadeInUp 0.4s ease',
  },
  iconCircle: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary-soft))',
    boxShadow: '0 0 0 8px var(--color-primary-light)',
    color: 'var(--color-primary-dark)',
    fontSize: '38px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '26px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--color-ink)',
    margin: '0 0 10px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--color-muted)',
    margin: '0 0 28px',
    lineHeight: 1.6,
  },
  detailCard: {
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border)',
    gap: '12px',
  },
  detailLabel: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: 0,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  detailValue: {
    fontSize: '14px',
    color: 'var(--color-ink)',
    margin: 0,
    fontWeight: 600,
    textAlign: 'right',
  },
  messages: {
    backgroundColor: 'var(--color-primary-light)',
    border: '1px solid var(--color-primary-soft)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--color-primary-dark)',
    marginBottom: '24px',
    fontWeight: 500,
  },
  receiptBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    border: '2px solid var(--color-ink)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  backBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '12px',
    boxSizing: 'border-box',
    boxShadow: '0 6px 16px rgba(22, 121, 74, 0.28)',
  },
  loginBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-primary)',
    border: '2px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  countdown: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: 0,
  },
};

export default SuccessPage;
