import React, { useState } from 'react';

function LoginPage() {

  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  async function handleLogin() {
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      const role = data.user.role;
      if (role === 'tenant')   window.location.href = '/tenant/dashboard';
      if (role === 'admin')    window.location.href = '/admin/dashboard';
      if (role === 'landlord') window.location.href = '/landlord/dashboard';
      if (role === 'agent')    window.location.href = '/agent/dashboard';

    } catch (err) {
      setError('Could not reach the server. Is Flask running?');
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card-lift">

        <div style={styles.logoCircle}>🏠</div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Ace Apartments · Eldoret</p>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Username</p>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                document.getElementById('login-password').focus();
              }
            }}
            placeholder="Enter your username"
            style={styles.input}
            className="input-field"
            autoFocus
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Password</p>
          <div style={styles.passwordRow}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              placeholder="Enter password"
              style={styles.passwordInput}
              className="input-field"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={styles.showBtn}
              className="btn-lift"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div style={styles.forgotRow}>
            <a href="/forgot-password" style={styles.forgotLink} className="link-underline">
              Forgot password?
            </a>
          </div>
        </div>

        {error !== '' && (
          <p style={styles.errorMsg}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
          className="btn-lift"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={styles.bottomLinks}>
          <div style={styles.linkGroup}>
            <p style={styles.linkText}>Don't have an account?</p>
            <a href="/register" style={styles.linkAnchor} className="link-underline">Register here →</a>
          </div>
          <div style={styles.linkGroup}>
            <p style={styles.linkText}>Want to make a payment?</p>
            <a href="/pay" style={styles.linkAnchor} className="link-underline">Pay Rent →</a>
          </div>
        </div>

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
  passwordRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  forgotRow: {
    textAlign: 'right',
    marginTop: '8px',
  },
  forgotLink: {
    fontSize: '13px',
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  passwordInput: {
    flex: 1,
    padding: '14px 16px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  showBtn: {
    padding: '14px 18px',
    background: 'var(--color-bg)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    fontWeight: 600,
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
  loginBtn: {
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
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  linkGroup: { textAlign: 'center' },
  linkText: { fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 4px' },
  linkAnchor: {
    fontSize: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};

export default LoginPage;
