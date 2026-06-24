import React, { useState } from 'react';
import AmountCard from '../components/AmountCard';
import TopBar from '../components/TopBar';

function PayPage() {
//apllication of usestate
  const [phone, setPhone]   = useState("");
  const [error, setError]   = useState("");
  const [paying, setPaying] = useState(false);
// will changed once flask and sql 
  const houseId    = 3;
  const rentAmount = 18000;
  const balance    = 4000;
  const waterbill  = 0;

  function handlePayment() {
    const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
//if statements
    if (!kenyanPhone.test(cleanPhone)) {
      setError('Please enter a valid Kenyan number e.g. 0712 345 678');
      return;
    }

    setError('');
    setPaying(true);

    setTimeout(() => {
      alert('M-Pesa will be prompted: ' + phone);
      setPaying(false);
    }, 1500);
  }

  return (
    <div style={styles.page}>

      <TopBar houseId={houseId} />

      <AmountCard
        rentAmount={rentAmount}
        balance={balance}
        waterBill={waterbill}
      />

      <div style={styles.formSection}>

        <p style={styles.label}>Your M-Pesa Number</p>

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712 345 678"
          maxLength={12}
          style={styles.input}
        />

        {error !== '' && (
          <p style={styles.errorMsg}>{error}</p>
        )}

        <button
          onClick={handlePayment}
          disabled={paying}
          style={{
            ...styles.payBtn,
            opacity: paying ? 0.7 : 1
          }}
        >
          {paying ? 'Processing...' : 'Pay via M-Pesa'}
        </button>

      </div>

    </div>
  );
}
//css inline for the document
const styles = {
  page: {
    maxWidth: '420px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
  },
  formSection: {
    padding: '22px 15px 0',
  },
  label: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 8px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  errorMsg: {
    color: '#b4a5a3',
    fontSize: '12px',
    margin: '6px 0 0',
  },
  payBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default PayPage;