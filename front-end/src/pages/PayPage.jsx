import React, { useState, useEffect } from 'react';

function PayPage() {

  const [unitData, setUnitData]         = useState(null);
  const [phone, setPhone]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [formError, setFormError]       = useState('');
  const [paying, setPaying]             = useState(false);
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 768);

  const params = new URLSearchParams(window.location.search);
  const unitId = parseInt(params.get('unit'));

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!unitId) {
        setError('Invalid house. Please scan the QR code again.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/units/${unitId}/public`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'House not found. Please scan the QR code again.');
          setLoading(false);
          return;
        }
        setUnitData(data);
      } catch (err) {
        setError('Could not reach the server. Is Flask running?');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [unitId]);

 async function handlePayment() {
    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) {
      setFormError('Please enter a valid Kenyan number e.g. 0712 345 678');
      return;
    }
    setFormError('');
    setPaying(true);

    try {
      const res = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          phone_used: cleanPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Payment failed. Please try again.');
        setPaying(false);
        return;
      }

      window.location.href =
        `/success?receipt=${data.receipt.receipt_no}` +
        `&unit=${data.receipt.unit_number}` +
        `&tenant=${encodeURIComponent(data.receipt.tenant_name)}` +
        `&amount=${data.receipt.amount_paid}` +
        `&mpesa=${data.receipt.mpesa_code}` +
        `&month=${encodeURIComponent(data.receipt.month)}`;

    } catch (err) {
      setFormError('Could not reach the server. Is Flask running?');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading...</p>
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

return (
    <div style={isDesktop ? styles.pageDesktop : styles.pageMobile}>

      <div style={isDesktop ? styles.innerDesktop : {}}>

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.headerLabel}>Property</p>
          <h1 style={styles.headerName}>{unitData.property_name}</h1>
          <p style={styles.headerLocation}>House {unitData.unit_number}</p>
        </div>

        {/* Card */}
        <div style={isDesktop ? styles.cardDesktop : styles.cardMobile}>

          {/* Account Badge */}
          <div style={styles.accountBadge}>
            ✓ Payment secured · {unitData.property_name}
            {unitData.payment_type === 'paybill' && (
              <> · Paybill {unitData.paybill_no} · Acc {unitData.account_no}</>
            )}
          </div>

          {/* Desktop — two column layout for inputs */}
          <div style={isDesktop ? styles.twoCol : {}}>

            <div style={isDesktop ? styles.col : {}}>
              {/* Phone */}
              <div style={styles.fieldGroup}>
                <p style={styles.fieldLabel}>Your M-Pesa Number</p>
                <input
                  id="pay-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePayment(); }}
                  placeholder="e.g. 0712 345 678"
                  maxLength={12}
                  style={styles.input}
                />
              </div>

              {/* Error */}
              {formError !== '' && (
                <p style={styles.formError}>{formError}</p>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={paying}
                style={{ ...styles.payBtn, opacity: paying ? 0.7 : 1 }}
              >
                {paying ? 'Processing...' : 'Pay via M-Pesa'}
              </button>
            </div>

          </div>

          {/* Login Link */}
          <div style={styles.loginLink}>
            <p style={styles.loginText}>Want to view your payment history?</p>
            <a href="/login" style={styles.loginAnchor}>
              Login to your account →
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {

  // ---- PAGE ----
  pageMobile: {
    maxWidth: '480px',
    margin: '0 auto',
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  pageDesktop: {
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
  innerDesktop: {
    width: '100%',
    maxWidth: '800px',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  errorText: {
    color: '#c0392b',
    fontSize: '15px',
    padding: '20px',
    textAlign: 'center',
  },

  // ---- HEADER ----
  header: {
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '40px 32px 48px',
    textAlign: 'center',
    borderRadius: '0 0 0 0',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 8px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  headerLocation: {
    fontSize: '14px',
    opacity: 0.75,
    margin: 0,
  },

  // ---- CARDS ----
  cardMobile: {
    background: 'white',
    borderRadius: '20px',
    margin: '-24px 20px 32px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    padding: '28px 24px',
  },
  cardDesktop: {
    background: 'white',
    borderRadius: '20px',
    margin: '-24px 32px 32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '40px 48px',
  },

  // ---- TWO COLUMN LAYOUT (desktop only) ----
  twoCol: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: '200px',
  },

  // ---- FORM FIELDS ----
  fieldGroup: {
    marginBottom: '20px',
  },
  fieldLabel: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#1a1a1a',
  },

  // ---- BADGES ----
  accountBadge: {
    background: '#e8f5ee',
    border: '1px solid #b8dfc9',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#1a7a4a',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: 500,
  },
  penaltyBadge: {
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#f57c00',
    textAlign: 'center',
    marginBottom: '24px',
    fontWeight: 500,
  },

  // ---- ERROR + BUTTON ----
  formError: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#fdecea',
    borderRadius: '8px',
  },
  payBtn: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '17px',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '8px',
  },

  // ---- LOGIN LINK ----
  loginLink: {
    textAlign: 'center',
    paddingTop: '24px',
    marginTop: '8px',
    borderTop: '1px solid #f0f0f0',
  },
  loginText: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 8px',
  },
  loginAnchor: {
    fontSize: '14px',
    color: '#1a7a4a',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default PayPage;