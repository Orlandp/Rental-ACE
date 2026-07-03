import React, { useState } from 'react';

const ADMIN_SECRET = 'admin20245';
const LANDLORD_SECRET = 'landlord20245';

const mockProperties = [
    { id: 1, name: 'Ace Apartments', location: 'Eldoret', rentAmount: 15000, waterBill: 500 },
];

function RegisterPage() {
    const [step, setStep]                           = useState(1);
    const [fullName, setFullName]                   = useState('');
    const [username, setUsername]                   = useState('');
    const [phone, setPhone]                         = useState('');
    const [idNumber, setIdNumber]                   = useState('');
    const [password, setPassword]                   = useState('');
    const [confirmPassword, setConfirmPassword]     = useState('');
    const [showPassword, setShowPassword]           = useState(false);
    const [role, setRole]                           = useState('');
    const [property, setProperty]                   = useState('');
    const [houseNumber, setHouseNumber]             = useState('');
    const [secretCode, setSecretCode]               = useState('');
    const [error, setError]                         = useState('');
    const [loading, setLoading]                     = useState(false);

    
   function handleRegister() {

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!username.trim()) {
       setError('Please enter a username.');
       return;
   }

    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) {
      setError('Please enter a valid Kenyan phone number.');
      return;
    }

    if (!idNumber.trim()) {
      setError('Please enter your ID number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!role) {
      setError('Please select your role.');
      return;
    }

    if (role === 'tenant') {
      if (!property) {
        setError('Please select your property.');
        return;
      }
      if (!houseNumber) {
        setError('Please select your house number.');
        return;
      }
    }

    if (role === 'admin' && secretCode !== ADMIN_SECRET) {
      setError('Invalid admin code.');
      return;
    }

    if (role === 'landlord' && secretCode !== LANDLORD_SECRET) {
      setError('Invalid landlord code.');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  }

  if (step === 2) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>

          <div style={styles.iconCircle}>
            {role === 'tenant' ? '⏳' : '✅'}
          </div>

          <h2 style={styles.title}>
            {role === 'tenant'
              ? 'Registration Pending'
              : 'Account Created!'}
          </h2>

          <p style={styles.confirmText}>
            {role === 'tenant'
              ? 'Your account is awaiting admin approval. You will receive an SMS once approved.'
              : 'Your account is ready. You can now login.'}
          </p>

          <button
            onClick={() => window.location.href = '/login'}
            style={styles.loginBtn}
          >
            Go to Login
          </button>

        </div>
      </div>
    );
  }
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logoCircle}>🏠</div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Ace Apartments · Eldoret</p>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Full Name</p>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. James Orlando"
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Phone Number</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            maxLength={12}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>ID Number</p>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="e.g. 12345678"
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
              placeholder="Min 6 characters"
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

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Confirm Password</p>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>I am a:</p>
          <div style={styles.roleRow}>
            {['tenant', 'admin', 'landlord'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setError(''); }}
                style={{
                  ...styles.roleBtn,
                  backgroundColor: role === r ? '#1a7a4a' : 'white',
                  color: role === r ? 'white' : '#555',
                  border: role === r ? '2px solid #1a7a4a' : '2px solid #ddd',
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {role === 'tenant' && (
          <div>
            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Select Property</p>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Select Property --</option>
                {mockProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.location}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Select House Number</p>
              <select
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Select House --</option>
                {[1,2,3,4,5,6,7,8,9].map((num) => (
                  <option key={num} value={num}>
                    House {num}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(role === 'admin' || role === 'landlord') && (
          <div style={styles.fieldGroup}>
            <p style={styles.fieldLabel}>
              {role === 'admin' ? 'Admin' : 'Landlord'} Secret Code
            </p>
            <input
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Enter secret code"
              style={styles.input}
            />
          </div>
        )}

        {error !== '' && (
          <p style={styles.errorMsg}>{error}</p>
        )}
        <div style={styles.fieldGroup}>
         <p style={styles.fieldLabel}>Username</p>
         <input
             type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. james123"
            style={styles.input}
            />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ ...styles.registerBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <div style={styles.loginLink}>
          <p style={styles.loginText}>Already have an account?</p>
          <a href="/login" style={styles.loginAnchor}>
            Login here →
          </a>
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
  iconCircle: {
    fontSize: '48px',
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
  confirmText: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.6,
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
  roleRow: {
    display: 'flex',
    gap: '8px',
  },
  roleBtn: {
    flex: 1,
    padding: '12px 8px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#1a1a1a',
  },
  errorMsg: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
  },
  registerBtn: {
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
  },
  loginLink: {
    textAlign: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  loginText: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 6px',
  },
  loginAnchor: {
    fontSize: '13px',
    color: '#1a7a4a',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default RegisterPage;
