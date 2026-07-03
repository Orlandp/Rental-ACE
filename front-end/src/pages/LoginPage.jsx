import React, { useState } from 'react';

const mockUsers = [
  { username: 'tenant1',   password: 'tenant123',   role: 'tenant'   },
  { username: 'admin1',    password: 'admin123',    role: 'admin'    },
  { username: 'landlord1', password: 'landlord123', role: 'landlord' },
];

function LoginPage() {

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  function handleLogin() {

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

    setTimeout(() => {
      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        setError('Incorrect username or password.');
        setLoading(false);
        return;
      }

      if (user.role === 'tenant')   window.location.href = '/tenant/dashboard';
      if (user.role === 'admin')    window.location.href = '/admin/dashboard';
      if (user.role === 'landlord') window.location.href = '/landlord/dashboard';

    }, 1500);
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
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Password</p>
          <div style={styles.passwordRow}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <a href="/register" style={styles.linkAnchor}>
              Register here →
            </a>
          </div>
          <div style={styles.linkGroup}>
            <p style={styles.linkText}>Want to make a payment?</p>
            <a href="/pay?property=1" style={styles.linkAnchor}>
              Pay via QR code →
            </a>
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
    padding: '40px 28px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logoCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#e8f5ee',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 6px',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 28px',
  },
  fieldGroup: {
    marginBottom: '16px',
    textAlign: 'left',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 6px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    color: '#1a1a1a',
  },
  passwordRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  showBtn: {
    padding: '14px 16px',
    background: '#f4f6f8',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#555',
  },
  errorMsg: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
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
    marginBottom: '20px',
  },
  bottomLinks: {
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  linkGroup: { textAlign: 'center' },
  linkText: { fontSize: '13px', color: '#888', margin: '0 0 4px' },
  linkAnchor: {
    fontSize: '13px',
    color: '#1a7a4a',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default LoginPage;