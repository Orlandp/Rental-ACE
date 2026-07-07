import React, { useState, useEffect } from 'react';

const mockProperties = {
  1: {
    property_id: 1,
    name: 'Ace Apartments',
    location: 'Eldoret',
    paybill: '4567',
    account_no: '9876543210',
    phone_no_house7: '0722223432',
    phone_no_house8: '0722223433',
    phone_no_house9: '0722223434',
  }
};

const mockUnits = {
  1: { unit_id: 1, unit_number: 'House 1', rent_amount: 12000, penalty_date: 5,  penalty_rate: 5.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  2: { unit_id: 2, unit_number: 'House 2', rent_amount: 15000, penalty_date: 5,  penalty_rate: 5.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  3: { unit_id: 3, unit_number: 'House 3', rent_amount: 18000, penalty_date: 5,  penalty_rate: 5.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  4: { unit_id: 4, unit_number: 'House 4', rent_amount: 20000, penalty_date: 10, penalty_rate: 8.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  5: { unit_id: 5, unit_number: 'House 5', rent_amount: 22000, penalty_date: 10, penalty_rate: 8.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  6: { unit_id: 6, unit_number: 'House 6', rent_amount: 25000, penalty_date: 5,  penalty_rate: 5.0, has_water: false, payment_type: 'paybill', house_type: 'Two Bedroom'  },
  7: { unit_id: 7, unit_number: 'House 7', rent_amount: 28000, penalty_date: 5,  penalty_rate: 5.0, has_water: true,  payment_type: 'phone',   house_type: 'One Bedroom'  },
  8: { unit_id: 8, unit_number: 'House 8', rent_amount: 28000, penalty_date: 10, penalty_rate: 8.0, has_water: true,  payment_type: 'phone',   house_type: 'One Bedroom'  },
  9: { unit_id: 9, unit_number: 'House 9', rent_amount: 28000, penalty_date: 5,  penalty_rate: 5.0, has_water: false, payment_type: 'phone',   house_type: 'Bedsitter'    },
};

function PayPage() {

  const [property, setProperty]         = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [unitData, setUnitData]         = useState(null);
  const [tenantName, setTenantName]     = useState('');
  const [amount, setAmount]             = useState('');
  const [phone, setPhone]               = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [formError, setFormError]       = useState('');
  const [paying, setPaying]             = useState(false);
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 768);

  const params     = new URLSearchParams(window.location.search);
  const propertyId = parseInt(params.get('property'));

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!propertyId) {
        setError('Invalid property. Please scan the QR code again.');
        setLoading(false);
        return;
      }
      try {
        const propertyData = mockProperties[propertyId];
        if (!propertyData) {
          setError('Property not found. Please scan the QR code again.');
          setLoading(false);
          return;
        }
        setProperty(propertyData);
      } catch (err) {
        setError('Could not load property. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId]);

  function handleUnitChange(e) {
    const unitId = parseInt(e.target.value);
    setSelectedUnit(unitId);
    setUnitData(mockUnits[unitId] || null);
    setFormError('');
  }

  function focusNext(id) {
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  function handlePayment() {
    if (!selectedUnit) {
      setFormError('Please select your house number.');
      return;
    }
    if (!tenantName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!amount || isNaN(amount) || parseInt(amount) < 1) {
      setFormError('Please enter a valid amount.');
      return;
    }
    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) {
      setFormError('Please enter a valid Kenyan number e.g. 0712 345 678');
      return;
    }
    setFormError('');
    setPaying(true);
    setTimeout(() => {
      alert(
        `Payment Details:\n\n` +
        `Name:   ${tenantName}\n` +
        `House:  ${selectedUnit}\n` +
        `Amount: Ksh ${parseInt(amount).toLocaleString()}\n` +
        `Phone:  ${phone}\n\n` +
        `M-Pesa STK push coming in backend phase!`
      );
      setPaying(false);
    }, 1500);
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
          <h1 style={styles.headerName}>{property.name}</h1>
          <p style={styles.headerLocation}>{property.location}</p>
        </div>

        {/* Card */}
        <div style={isDesktop ? styles.cardDesktop : styles.cardMobile}>

          {/* House Selector */}
          <div style={styles.fieldGroup}>
            <p style={styles.fieldLabel}>Select Your House Number</p>
            <select
              value={selectedUnit}
              onChange={handleUnitChange}
              style={styles.select}
            >
              <option value="">-- Select House --</option>
              {[1,2,3,4,5,6,7,8,9].map((num) => (
                <option key={num} value={num}>
                  House {num} — {mockUnits[num]?.house_type}
                </option>
              ))}
            </select>
          </div>

          {/* Account Badge */}
          {unitData && (
            <div style={styles.accountBadge}>
              ✓ Payment secured · {property.name}
            </div>
          )}

          {/* Penalty Badge */}
          {unitData && (
            <div style={styles.penaltyBadge}>
              ⚠ Late penalty after {unitData.penalty_date}th
              ({unitData.penalty_rate}% of amount)
            </div>
          )}

          {/* Desktop — two column layout for inputs */}
          <div style={isDesktop ? styles.twoCol : {}}>

            <div style={isDesktop ? styles.col : {}}>
              {/* Full Name */}
              <div style={styles.fieldGroup}>
                <p style={styles.fieldLabel}>Your Full Name</p>
                <input
                  id="pay-name"
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') focusNext('pay-amount'); }}
                  placeholder="e.g. James Orlando"
                  style={styles.input}
                />
              </div>

              {/* Amount */}
              <div style={styles.fieldGroup}>
                <p style={styles.fieldLabel}>Amount to Pay (Ksh)</p>
                <input
                  id="pay-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') focusNext('pay-phone'); }}
                  placeholder="e.g. 18000"
                  style={styles.input}
                  min="1"
                />
              </div>
            </div>

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