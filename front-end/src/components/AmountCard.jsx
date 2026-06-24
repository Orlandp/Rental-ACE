import React from 'react';

function AmountCard({ rentAmount, balance, waterBill }) {

  const total = rentAmount + (balance || 0) + (waterBill || 0);

  return (
    <div style={styles.card}>

      <div style={styles.col}>
        <p style={styles.label}>Rent Due</p>
        <p style={styles.value}>Ksh {rentAmount.toLocaleString()}</p>
      </div>

      <div style={styles.divider} />

      <div style={styles.col}>
        <p style={styles.label}>Balance</p>
        <p style={{
          ...styles.value,
          color: balance > 0 ? '#c0392b' : '#1a1a1a'
        }}>
          Ksh {(balance || 0).toLocaleString()}
        </p>
      </div>

      <div style={styles.divider} />

      <div style={styles.col}>
        <p style={styles.label}>Total</p>
        <p style={styles.value}>Ksh {total.toLocaleString()}</p>
      </div>

    </div>
  );
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '16px',
    margin: '-20px 16px 0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    textAlign: 'center',
  },
  label: {
    fontSize: '11px',
    color: '#888',
    margin: '0 0 4px',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
  divider: {
    width: '1px',
    height: '40px',
    backgroundColor: '#e8e8e8',
  },
};

export default AmountCard;