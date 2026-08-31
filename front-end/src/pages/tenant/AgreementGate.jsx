import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config';

function AgreementGate({ onSigned, photoOnly }) {

  const [agreement, setAgreement]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [signing, setSigning]         = useState(false);
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState('');
  const [idPhotoError, setIdPhotoError]     = useState('');

  useEffect(() => {
    async function loadAgreement() {
      try {
        const res = await fetch(`${API_BASE}/api/tenants/me/agreement`, {
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
      const res = await fetch(`${API_BASE}/api/tenants/me/agreement/pdf`, {
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

  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    setIdPhotoFile(file || null);
    setIdPhotoError('');
    if (file) {
      setIdPhotoPreview(URL.createObjectURL(file));
    } else {
      setIdPhotoPreview('');
    }
  }

  async function handleSubmitSignature() {
    if (!idPhotoFile) {
      setIdPhotoError('Please choose a photo of your ID or passport.');
      return;
    }

    setSigning(true);
    try {
      const formData = new FormData();
      formData.append('id_photo', idPhotoFile);

      const res = await fetch(`${API_BASE}/api/tenants/me/agreement/sign`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setIdPhotoError(data.error || 'Could not record your agreement.');
        setSigning(false);
        return;
      }
      if (onSigned) {
        onSigned();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setIdPhotoError('Could not reach the server.');
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
          <p style={styles.headerLabel}>{photoOnly ? 'Action Needed' : 'Before You Continue'}</p>
          <h1 style={styles.headerTitle}>{photoOnly ? 'Resubmit Your ID / Passport' : 'Tenancy Agreement'}</h1>
          <p style={styles.headerSub}>
            {photoOnly
              ? 'The office has asked you to submit a fresh photo of your ID or passport. Please upload one to continue to your dashboard.'
              : 'Please review your tenancy details and the agreement below. Submit your ID/passport photo first, then click "I Agree" to continue to your dashboard.'}
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
        {!photoOnly && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Agreement Terms</p>
            <div style={styles.agreementText}>
              {agreement.template_content.split('\n\n').map((paragraph, i) => (
                <p key={i} style={styles.paragraph}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: ID Photo — required before the contract can be agreed to */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Step 1 · Submit Your ID / Passport Photo</p>
          <p style={styles.modalText}>
            Choose a clear photo of your ID or passport. This is submitted and placed on your
            tenancy agreement as your signature — the office will review it after you agree below.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={styles.fileInput}
            className="input-field"
          />

          {idPhotoPreview && (
            <img src={idPhotoPreview} alt="ID preview" style={styles.photoPreview} />
          )}

          {idPhotoError && <p style={styles.modalError}>{idPhotoError}</p>}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          {!photoOnly && (
            <button onClick={handleDownloadPdf} style={styles.downloadBtn} className="btn-lift">
              📄 Download Agreement (PDF)
            </button>
          )}
          <button
            onClick={handleSubmitSignature}
            disabled={signing || !idPhotoFile}
            style={{ ...styles.agreeBtn, opacity: idPhotoFile ? 1 : 0.6 }}
            className="btn-lift"
          >
            {signing ? 'Submitting...' : (photoOnly ? 'Submit ID Photo' : 'Step 2 · I Agree')}
          </button>
          {!idPhotoFile && (
            <p style={styles.helperNote}>Choose your ID/passport photo above to continue.</p>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 50% 0%, var(--color-primary-soft-2) 0%, var(--color-bg) 40%)',
    fontFamily: 'var(--font-sans)',
    padding: '40px 16px',
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
    fontFamily: 'var(--font-sans)',
  },
  loadingText: { color: 'var(--color-muted)', fontSize: '15px' },
  errorText: { color: 'var(--color-danger)', fontSize: '15px', textAlign: 'center', padding: '24px' },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  headerLabel: {
    fontSize: '12px',
    color: 'var(--color-primary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    margin: '0 0 8px',
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '30px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--color-ink)',
    margin: '0 0 12px',
  },
  headerSub: {
    fontSize: '14px',
    color: 'var(--color-ink-soft)',
    lineHeight: 1.6,
    margin: '0 auto',
    maxWidth: '480px',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--color-border)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
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
    borderBottom: '1px solid var(--color-border)',
    gap: '12px',
  },
  detailLabel: { fontSize: '13px', color: 'var(--color-ink-soft)', margin: 0 },
  detailValue: { fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', margin: 0, textAlign: 'right' },
  agreementText: {
    maxHeight: '360px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  paragraph: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
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
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    border: '2px solid var(--color-ink)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    fontWeight: 600,
    boxSizing: 'border-box',
  },
  agreeBtn: {
    width: '100%',
    padding: '18px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '17px',
    fontWeight: 700,
    boxSizing: 'border-box',
    boxShadow: '0 8px 20px rgba(22, 121, 74, 0.3)',
  },
  helperNote: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    textAlign: 'center',
    margin: '4px 0 0',
  },
  modalText: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    lineHeight: 1.6,
    margin: '0 0 18px',
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    marginBottom: '14px',
  },
  photoPreview: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '220px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    margin: '0 0 14px',
    objectFit: 'contain',
  },
  modalError: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    margin: '0 0 14px',
  },
};

export default AgreementGate;
