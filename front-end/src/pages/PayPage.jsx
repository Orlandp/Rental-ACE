import React, { useState, useEffect } from 'react';

function PayPage() {

  const [unitData, setUnitData]         = useState(null);
  const [phone, setPhone]               = useState('');
  const [amount, setAmount]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [formError, setFormError]       = useState('');
  const [paying, setPaying]             = useState(false);
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 768);
  const [propertyList, setPropertyList] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [houseUnits, setHouseUnits]     = useState([]);
  const [housesLoading, setHousesLoading] = useState(false);
  const [selectedHouseUnit, setSelectedHouseUnit] = useState('');

  const params = new URLSearchParams(window.location.search);
  const unitId = parseInt(params.get('unit'));
  const propertyId = params.get('property');

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchHouseUnits(propId) {
      setHousesLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/api/properties/${propId}/units/public`);
        const data = await res.json();
        setHouseUnits(res.ok && data.units ? data.units : []);
      } catch (err) {
        setHouseUnits([]);
      } finally {
        setHousesLoading(false);
      }
    }

    async function loadData() {
      if (!unitId) {
        // No unit given — show the "select your property, then your house"
        // screen. This scales automatically as more properties are added.
        try {
          const res = await fetch('http://localhost:5001/api/properties');
          const data = await res.json();
          if (res.ok && Array.isArray(data) && data.length > 0) {
            setPropertyList(data);
            const initialPropertyId = String(propertyId || data[0].property_id);
            setSelectedPropertyId(initialPropertyId);
            setLoading(false);
            await fetchHouseUnits(initialPropertyId);
            return;
          }
        } catch (err) {
          // fall through to the generic invalid-link error below
        }
        setError('Invalid house. Please use the payment link sent to you.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5001/api/units/${unitId}/public`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'House not found. Please use the payment link sent to you.');
          setLoading(false);
          return;
        }
        setUnitData(data);
        if (data.has_invoice) {
          setAmount(String(data.total_due));
        }
      } catch (err) {
        setError('Could not reach the server. Is Flask running?');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [unitId, propertyId]);

  async function handlePropertyChange(newPropertyId) {
    setSelectedPropertyId(newPropertyId);
    setSelectedHouseUnit('');
    setHousesLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/properties/${newPropertyId}/units/public`);
      const data = await res.json();
      setHouseUnits(res.ok && data.units ? data.units : []);
    } catch (err) {
      setHouseUnits([]);
    } finally {
      setHousesLoading(false);
    }
  }

  function handleUseFullBalance() {
    if (unitData && unitData.has_invoice) {
      setAmount(String(unitData.total_due));
      setFormError('');
    }
  }

 async function handlePayment() {
    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) {
      setFormError('Please enter a valid Kenyan number e.g. 0712 345 678');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }
    setFormError('');
    setPaying(true);

    try {
      const res = await fetch('http://localhost:5001/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          phone_used: cleanPhone,
          amount: parsedAmount,
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
        `&payment_id=${data.receipt.payment_id}` +
        `&invoice_no=${encodeURIComponent(data.receipt.invoice_no || '')}` +
        `&unit=${data.receipt.unit_number}` +
        `&tenant=${encodeURIComponent(data.receipt.tenant_name)}` +
        `&amount=${data.receipt.amount_paid}` +
        `&rent=${data.receipt.rent_amount}` +
        `&penalty=${data.receipt.penalty}` +
        `&balance_remaining=${data.receipt.balance_remaining}` +
        `&mpesa=${data.receipt.mpesa_code}` +
        `&month=${encodeURIComponent(data.receipt.month)}` +
        `&date=${encodeURIComponent(data.receipt.payment_date)}`;

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

  if (propertyList) {
    return (
      <div style={isDesktop ? styles.pageDesktop : styles.pageMobile}>
        <div style={isDesktop ? styles.innerDesktop : {}}>
          <div style={styles.header}>
            <p style={styles.headerLabel}>Pay Rent</p>
            <h1 style={styles.headerName}>Find Your House</h1>
            <p style={styles.headerLocation}>Select your property and house number to continue</p>
          </div>
          <div style={isDesktop ? styles.cardDesktop : styles.cardMobile}>
            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>Property</p>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                style={styles.select}
                className="input-field"
              >
                {propertyList.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name} — {p.location}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <p style={styles.fieldLabel}>House Number</p>
              <select
                value={selectedHouseUnit}
                onChange={(e) => setSelectedHouseUnit(e.target.value)}
                style={styles.select}
                className="input-field"
                disabled={housesLoading || houseUnits.length === 0}
              >
                <option value="">
                  {housesLoading ? 'Loading houses...' : 'Choose your house...'}
                </option>
                {houseUnits.map((u) => (
                  <option key={u.unit_id} value={u.unit_id}>House {u.unit_number}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => { window.location.href = `/pay?unit=${selectedHouseUnit}`; }}
              disabled={!selectedHouseUnit}
              style={{ ...styles.payBtn, opacity: selectedHouseUnit ? 1 : 0.5 }}
              className="btn-lift"
            >
              Continue
            </button>
            <div style={styles.loginLink}>
              <p style={styles.loginText}>Want to view your payment history?</p>
              <a href="/login" style={styles.loginAnchor} className="link-underline">
                Login to your account →
              </a>
            </div>
          </div>
        </div>
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
            ✓ Payment secured · {unitData.property_name} · Paybill {unitData.paybill_no} · Acc {unitData.account_no}
          </div>

          {/* Invoice */}
          <div style={styles.invoiceCard}>
            <p style={styles.invoiceTitle}>
              {unitData.has_invoice ? `Invoice ${unitData.invoice_no} — ${unitData.current_month}` : 'Invoice'}
            </p>

            {!unitData.has_invoice ? (
              <div style={{ ...styles.penaltyBadge, backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-soft)', color: 'var(--color-primary-dark)' }}>
                ✓ You have no outstanding balance right now. Want to pay ahead for next month? Enter an amount below.
              </div>
            ) : (
              <>
                {unitData.invoice_status === 'partial' && (
                  <div style={styles.invoiceRow}>
                    <p style={styles.invoiceLabel}>Already Paid</p>
                    <p style={{ ...styles.invoiceValue, color: 'var(--color-primary)' }}>
                      Ksh {unitData.amount_paid.toLocaleString()}
                    </p>
                  </div>
                )}
                <div style={styles.invoiceRow}>
                  <p style={styles.invoiceLabel}>Rent Due</p>
                  <p style={styles.invoiceValue}>Ksh {unitData.rent_amount.toLocaleString()}</p>
                </div>
                {unitData.penalty > 0 && (
                  <div style={styles.invoiceRow}>
                    <p style={styles.invoiceLabel}>Late Penalty</p>
                    <p style={{ ...styles.invoiceValue, color: 'var(--color-danger)' }}>
                      Ksh {unitData.penalty.toLocaleString()}
                    </p>
                  </div>
                )}
                {unitData.has_water_bill === 1 && (
                  <div style={styles.invoiceRow}>
                    <p style={styles.invoiceLabel}>Water Bill (billed separately)</p>
                    <p style={styles.invoiceValue}>Ksh {unitData.water_bill.toLocaleString()}</p>
                  </div>
                )}
                <div
                  onClick={handleUseFullBalance}
                  title="Click to fill in the full balance"
                  style={{
                    ...styles.invoiceRow,
                    borderTop: '2px solid var(--color-border)',
                    paddingTop: '12px',
                    marginTop: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ ...styles.invoiceLabel, fontWeight: 700, color: 'var(--color-ink)', fontSize: '14px' }}>
                    Balance Due
                  </p>
                  <p style={{ ...styles.invoiceValue, fontSize: '18px', color: 'var(--color-primary)' }}>
                    Ksh {unitData.total_due.toLocaleString()}
                  </p>
                </div>

                {unitData.penalty > 0 && (
                  <div style={styles.penaltyBadge}>
                    ⚠ A late penalty has been added since rent wasn't paid by the 5th.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop — two column layout for inputs */}
          <div style={isDesktop ? styles.twoCol : {}}>

              <div style={isDesktop ? styles.col : {}}>
                {/* Amount */}
                <div style={styles.fieldGroup}>
                  <p style={styles.fieldLabel}>Amount to Pay</p>
                  <input
                    id="pay-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    style={styles.input}
                    className="input-field"
                  />
                  <p style={styles.amountHint}>
                    Paying less than the full balance? That's fine — pay again anytime before the
                    5th to top it up and avoid a late penalty.
                  </p>
                </div>

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
                    className="input-field"
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
                  className="btn-lift"
                >
                  {paying
                    ? 'Processing...'
                    : `Pay Ksh ${(parseFloat(amount) || 0).toLocaleString()} via M-Pesa`}
                </button>
              </div>

            </div>

          {/* Login Link */}
          <div style={styles.loginLink}>
            <p style={styles.loginText}>Want to view your payment history?</p>
            <a href="/login" style={styles.loginAnchor} className="link-underline">
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
    backgroundColor: 'var(--color-bg)',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
  },
  pageDesktop: {
    backgroundColor: 'var(--color-bg)',
    minHeight: '100vh',
    fontFamily: 'var(--font-sans)',
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
  loadingText: { color: 'var(--color-muted)', fontSize: '15px' },
  errorText: {
    color: 'var(--color-danger)',
    fontSize: '15px',
    padding: '20px',
    textAlign: 'center',
  },

  // ---- HEADER ----
  header: {
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    color: 'var(--color-text-on-brand)',
    padding: '40px 32px 48px',
    textAlign: 'center',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 8px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  headerName: {
    fontFamily: 'var(--font-display)',
    fontSize: '32px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: '0 0 8px',
  },
  headerLocation: {
    fontSize: '14px',
    opacity: 0.8,
    margin: 0,
  },

  // ---- CARDS ----
  cardMobile: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    margin: '-24px 20px 32px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
    padding: '28px 24px',
  },
  cardDesktop: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    margin: '-24px 32px 32px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-border)',
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
    color: 'var(--color-ink-soft)',
    margin: '0 0 8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  amountHint: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    margin: '8px 0 0',
    lineHeight: 1.5,
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

  // ---- BADGES ----
  accountBadge: {
    background: 'var(--color-primary-light)',
    border: '1px solid var(--color-primary-soft)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--color-primary-dark)',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: 500,
  },
  penaltyBadge: {
    background: 'var(--color-warning-light)',
    border: '1px solid var(--color-warning-strong)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    fontSize: '13px',
    color: 'var(--color-warning)',
    textAlign: 'center',
    marginBottom: '24px',
    fontWeight: 500,
  },

  // ---- INVOICE ----
  invoiceCard: {
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    marginBottom: '24px',
  },
  invoiceTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-ink-soft)',
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  invoiceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  invoiceLabel: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: 0,
  },
  invoiceValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-ink)',
    margin: 0,
  },

  // ---- ERROR + BUTTON ----
  formError: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    margin: '0 0 16px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'var(--color-danger-light)',
    borderRadius: 'var(--radius-sm)',
  },
  payBtn: {
    width: '100%',
    padding: '18px',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '17px',
    fontWeight: 700,
    marginBottom: '8px',
    boxShadow: '0 8px 20px rgba(22, 121, 74, 0.3)',
  },

  // ---- LOGIN LINK ----
  loginLink: {
    textAlign: 'center',
    paddingTop: '24px',
    marginTop: '8px',
    borderTop: '1px solid var(--color-border)',
  },
  loginText: {
    fontSize: '14px',
    color: 'var(--color-muted)',
    margin: '0 0 8px',
  },
  loginAnchor: {
    fontSize: '14px',
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};

export default PayPage;