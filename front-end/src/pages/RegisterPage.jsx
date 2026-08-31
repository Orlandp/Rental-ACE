import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

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
  const [properties, setProperties]               = useState([]);
  const [property, setProperty]                   = useState('');
  const [houseNumber, setHouseNumber]             = useState('');
  const [secretCode, setSecretCode]               = useState('');
  const [error, setError]                         = useState('');
  const [loading, setLoading]                     = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/properties`)
      .then(res => res.json())
      .then(data => setProperties(data))
      .catch(err => console.error('Could not load properties:', err));
  }, []);

  function focusNext(id) {
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  async function handleRegister() {
    if (!fullName.trim())    { setError('Please enter your full name.');         return; }
    if (!username.trim())    { setError('Please enter a username.');              return; }
    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) { setError('Please enter a valid Kenyan phone number.'); return; }
    if (!idNumber.trim())    { setError('Please enter your ID number.');          return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.');      return; }
    if (!role)               { setError('Please select your role.');              return; }
    if (role === 'tenant') {
      if (!property)    { setError('Please select your property.');   return; }
      if (!houseNumber) { setError('Please select your house number.'); return; }
    }
    if (role === 'agent' && !property) {
      setError('Please select the property you are assigned to.');
      return;
    }
    if ((role === 'admin' || role === 'landlord' || role === 'agent') && !secretCode.trim()) {
      setError(`Please enter the ${role} secret code.`);
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      full_name: fullName.trim(),
      username: username.trim(),
      phone: cleanPhone,
      id_number: idNumber.trim(),
      password,
      role,
    };

    if (role === 'admin' || role === 'landlord' || role === 'agent') {
      payload.secret_code = secretCode.trim();
    }

    if (role === 'tenant') {
      payload.unit_id = parseInt(houseNumber, 10);
    }

    if (role === 'agent') {
      payload.assigned_property_id = parseInt(property, 10);
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(2);

    } catch (err) {
      setError('Could not reach the server. Is Flask running?');
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <div style={styles.page}>
        <div style={styles.card} className="card-lift">
          <div style={styles.iconCircle}>{(role === 'tenant' || role === 'agent') ? '⏳' : '✅'}</div>
          <h2 style={styles.title}>
            {(role === 'tenant' || role === 'agent') ? 'Registration Pending' : 'Account Created!'}
          </h2>
          <p style={styles.confirmText}>
            {(role === 'tenant' || role === 'agent')
              ? 'Your account is awaiting admin approval. You will receive a WhatsApp message once approved.'
              : 'Your account is ready. You can now login.'}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={styles.registerBtn}
            className="btn-lift"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="card-lift">

        <div style={styles.logoCircle}>🏠</div>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Ace Apartments · Eldoret</p>

        {/* Full Name */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Full Name</p>
          <input
            id="reg-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') focusNext('reg-username'); }}
            placeholder="e.g. James Orlando"
            style={styles.input}
            className="input-field"
            autoFocus
          />
        </div>

        {/* Username */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Username</p>
          <input
            id="reg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') focusNext('reg-phone'); }}
            placeholder="e.g. james123"
            style={styles.input}
            className="input-field"
          />
        </div>

        {/* Phone */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Phone Number</p>
          <input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') focusNext('reg-id'); }}
            placeholder="e.g. 0712 345 678"
            maxLength={12}
            style={styles.input}
            className="input-field"
          />
        </div>

        {/* ID Number */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>ID Number</p>
          <input
            id="reg-id"
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') focusNext('reg-password'); }}
            placeholder="e.g. 12345678"
            style={styles.input}
            className="input-field"
          />
        </div>

        {/* Password */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Password</p>
          <div style={styles.passwordRow}>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') focusNext('reg-confirm'); }}
              placeholder="Min 6 characters"
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
        </div>

        {/* Confirm Password */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Confirm Password</p>
          <input
            id="reg-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
            placeholder="Repeat password"
            style={styles.input}
            className="input-field"
          />
        </div>

        {/* Role */}
        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>I am a:</p>
          <div style={styles.roleRow}>
            {['tenant', 'admin', 'landlord', 'agent'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setError(''); }}
                style={{
                  ...styles.roleBtn,
                  backgroundColor: role === r ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: role === r ? 'var(--color-text-on-brand)' : 'var(--color-ink-soft)',
                  border: role === r ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                }}
                className="btn-lift"
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Fields */}
        {role === 'tenant' && (
          <div>
            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Select Property</p>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                style={styles.select}
                className="input-field"
              >
                <option value="">-- Select Property --</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name} · {p.location}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Select House Number (requested — admin will confirm)</p>
              <select
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                style={styles.select}
                className="input-field"
              >
                <option value="">-- Select House --</option>
                {[1,2,3,4,5,6,7,8,9].map((num) => (
                  <option key={num} value={num}>House {num}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Agent Fields */}
        {role === 'agent' && (
          <div style={styles.fieldGroup}>
            <p style={styles.fieldLabel}>Property You Are Assigned To</p>
            <select
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              style={styles.select}
              className="input-field"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name} · {p.location}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Secret Code */}
        {(role === 'admin' || role === 'landlord' || role === 'agent') && (
          <div style={styles.fieldGroup}>
            <p style={styles.fieldLabel}>
              {role === 'admin' ? 'Admin' : role === 'landlord' ? 'Landlord' : 'Agent'} Secret Code
            </p>
            <input
              id="reg-secret"
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
              placeholder="Enter secret code"
              style={styles.input}
              className="input-field"
            />
          </div>
        )}

        {error !== '' && (
          <p style={styles.errorMsg}>{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ ...styles.registerBtn, opacity: loading ? 0.7 : 1 }}
          className="btn-lift"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>

        <div style={styles.loginLink}>
          <p style={styles.loginText}>Already have an account?</p>
          <a href="/login" style={styles.loginAnchor} className="link-underline">Login here →</a>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 85% 10%, var(--color-primary-soft-2) 0%, var(--color-bg) 45%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
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
  iconCircle: {
    fontSize: '56px',
    margin: '0 auto 24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '26px',
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
  confirmText: {
    fontSize: '15px',
    color: 'var(--color-ink-soft)',
    lineHeight: 1.7,
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
  roleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  roleBtn: {
    flex: '1 1 40%',
    padding: '14px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    fontWeight: 700,
  },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
  },
  errorMsg: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
    padding: '10px 14px',
    backgroundColor: 'var(--color-danger-light)',
    borderRadius: 'var(--radius-sm)',
  },
  registerBtn: {
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
  loginLink: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid var(--color-border)',
  },
  loginText: {
    fontSize: '14px',
    color: 'var(--color-muted)',
    margin: '0 0 6px',
  },
  loginAnchor: {
    fontSize: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};

export default RegisterPage;
