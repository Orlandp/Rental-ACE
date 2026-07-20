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
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
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

    } catch (err) {
      setError('Could not reach the server. Is Flask running?');
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logoCircle}>🏠</div>
        <h2 style={styles.title}>Welcome Back</h2>
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
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={styles.showBtn}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error !== '' && (
          <p style={styles.errorMsg}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.loginBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div style={styles.bottomLinks}>
          <div style={styles.linkGroup}>
            <p style={styles.linkText}>Don't have an account?</p>
            <a href="/register" style={styles.linkAnchor}>Register here →</a>
          </div>
          <div style={styles.linkGroup}>
            <p style={styles.linkText}>Want to make a payment?</p>
            <a href="/pay?property=1" style={styles.linkAnchor}>Pay via QR code →</a>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logoCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: '#e8f5ee',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px',
  },
  fieldGroup: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 8px',
    fontWeight: 600,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    color: '#1a1a1a',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  passwordRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  showBtn: {
    padding: '14px 18px',
    background: '#f4f6f8',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#555',
    fontWeight: 500,
  },
  errorMsg: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fdecea',
    borderRadius: '8px',
  },
  loginBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '24px',
    transition: 'background-color 0.2s',
  },
  bottomLinks: {
    paddingTop: '20px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  linkGroup: { textAlign: 'center' },
  linkText: { fontSize: '13px', color: '#888', margin: '0 0 4px' },
  linkAnchor: {
    fontSize: '14px',
    color: '#1a7a4a',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default LoginPage;