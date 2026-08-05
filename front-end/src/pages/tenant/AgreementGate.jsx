import React, { useState, useEffect } from 'react';

function AgreementGate({ onSigned }) {

  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [signing, setSigning]     = useState(false);

  useEffect(() => {
    async function loadAgreement() {
      try {
        const res = await fetch('http://localhost:5000/api/tenants/me/agreement', {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not load your tenancy agreement.');
          return;
        }
        setAgreement(data);
      } catch (err) {
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    }
    loadAgreement();
  }, []);

  async function handleDownloadPdf() {
    try {
      const res = await fetch('http://localhost:5000/api/tenants/me/agreement/pdf', {
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
      a.download = `tenancy-agreement-house-${agreement.unit_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleAgree() {
    const confirmed = window.confirm(
      'By clicking OK, you confirm you have read and agree to the terms of this Tenancy Agreement.'
    );
    if (!confirmed) return;

    setSigning(true);
    try {
      const res = await fetch('http://localhost:5000/api/tenants/me/agreement/sign', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not record your agreement.');
        setSigning(false);
        return;
      }
      if (onSigned) {
        onSigned();
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert('Could not reach the server.');
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading your tenancy agreement...</p>
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

  const { penalty_terms: penalty } = agreement;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.headerLabel}>Before You Continue</p>
          <h1 style={styles.headerTitle}>Tenancy Agreement</h1>
          <p style={styles.headerSub}>
            Please review your tenancy details and the agreement below, then click
            "I Agree" to continue to your dashboard.
          </p>
        </div>

        {/* Details Card */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Your Tenancy Details</p>
          <div style={styles.detailsTable}>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>Tenant</p>
              <p style={styles.detailValue}>{agreement.full_name}</p>
            </div>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>Unit</p>
              <p style={styles.detailValue}>House {agreement.unit_number}</p>
            </div>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>Monthly Rent</p>
              <p style={styles.detailValue}>Ksh {agreement.rent_amount.toLocaleString()}</p>
            </div>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>Security Deposit</p>
              <p style={styles.detailValue}>Ksh {agreement.deposit_amount.toLocaleString()}</p>
            </div>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>
                Late Penalty (day {penalty.grace_day + 1}–{penalty.escalation_day})
              </p>
              <p style={styles.detailValue}>
                {(penalty.tier1_rate * 100).toFixed(0)}% — Ksh {penalty.tier1_amount.toLocaleString()}
              </p>
            </div>
            <div style={styles.detailRow}>
              <p style={styles.detailLabel}>
                Late Penalty (day {penalty.escalation_day + 1}+)
              </p>
              <p style={styles.detailValue}>
                {(penalty.tier2_rate * 100).toFixed(0)}% — Ksh {penalty.tier2_amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Text */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Agreement Terms</p>
          <div style={styles.agreementText}>
            {agreement.template_content.split('\n\n').map((paragraph, i) => (
              <p key={i} style={styles.paragraph}>{paragraph.trim()}</p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={handleDownloadPdf} style={styles.downloadBtn}>
            📄 Download Agreement (PDF)
          </button>
          <button onClick={handleAgree} disabled={signing} style={styles.agreeBtn}>
            {signing ? 'Recording...' : 'I Agree'}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    padding: '32px 16px',
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  errorText: { color: '#c0392b', fontSize: '15px', textAlign: 'center', padding: '24px' },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  headerLabel: {
    fontSize: '12px',
    color: '#1a7a4a',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    margin: '0 0 8px',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 12px',
  },
  headerSub: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    margin: '0 auto',
    maxWidth: '480px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  detailsTable: {},
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '12px',
  },
  detailLabel: { fontSize: '13px', color: '#555', margin: 0 },
  detailValue: { fontSize: '14px', fontWeight: 600, color: '#1a1a1a', margin: 0, textAlign: 'right' },
  agreementText: {
    maxHeight: '360px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  paragraph: {
    fontSize: '13px',
    color: '#444',
    lineHeight: 1.7,
    margin: '0 0 14px',
    whiteSpace: 'pre-line',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
  },
  downloadBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'white',
    color: '#1a1a1a',
    border: '2px solid #1a1a1a',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  agreeBtn: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: 700,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
};

export default AgreementGate;
