import React, { useState } from 'react';

function ForgotPasswordPage() {

  const [username, setUsername] = useState('');
  const [phone, setPhone]       = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !phone.trim()) {
      setError('Please enter both your username and phone number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), phone: phone.trim() }),
      });
      await response.json();
      setSubmitted(true);
    } catch (err) {
      setError('Could not reach the server. Is Flask running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card-lift">

        <div style={styles.logoCircle}>🔑</div>
        <h2 style={styles.title}>Forgot Password</h2>

        {submitted ? (
          <>
            <p style={styles.subtitle}>
              If those details match an account, your request has been sent.
              Your admin or agent will reach out with a new password shortly.
            </p>
            <a href="/login" style={styles.backAnchor} className="link-underline">
              ← Back to Login
            </a>
          </>
        ) : (
          <>
            <p style={styles.subtitle}>
              Enter your username and the phone number on your account. Your
              admin or agent will verify it's you and set a new password.
            </p>

            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Username</p>
              <input
                id="forgot-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') document.getElementById('forgot-phone').focus();
                }}
                placeholder="Enter your username"
                style={styles.input}
                className="input-field"
                autoFocus
              />
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Phone Number</p>
              <input
                id="forgot-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="e.g. 0712 345 678"
                style={styles.input}
                className="input-field"
              />
            </div>

            {error !== '' && (
              <p style={styles.errorMsg}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
              className="btn-lift"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>

            <div style={styles.bottomLinks}>
              <a href="/login" style={styles.linkAnchor} className="link-underline">
                ← Back to Login
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 15% 10%, var(--color-primary-soft-2) 0%, var(--color-bg) 45%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'var(--font-sans)',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
    textAlign: 'center',
    animation: 'fadeInUp 0.4s ease',
  },
  logoCircle: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary-soft))',
    boxShadow: '0 0 0 6px var(--color-primary-light)',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '27px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: '0 0 8px',
    color: 'var(--color-ink)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-muted)',
    margin: '0 0 32px',
    lineHeight: 1.6,
  },
  fieldGroup: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  fieldLabel: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: '0 0 8px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  errorMsg: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'var(--color-danger-light)',
    borderRadius: 'var(--radius-sm)',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '24px',
    boxShadow: '0 6px 16px rgba(22, 121, 74, 0.28)',
  },
  bottomLinks: {
    paddingTop: '20px',
    borderTop: '1px solid var(--color-border)',
    textAlign: 'center',
  },
  linkAnchor: {
    fontSize: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
  backAnchor: {
    fontSize: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};

export default ForgotPasswordPage;
