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
        <p style={{ ...styles.value, color: balance > 0 ? 'var(--color-danger-strong)' : 'var(--color-ink)' }}>
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
    background: 'var(--color-surface)',
    borderRadius: '16px',
    margin: '-20px 16px 0',
    boxShadow: 'var(--shadow-md)',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col: { flex: 1, textAlign: 'center' },
  label: { fontSize: '11px', color: 'var(--color-muted)', margin: '0 0 4px', textTransform: 'uppercase' },
  value: { fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--color-ink)' },
  divider: { width: '1px', height: '40px', backgroundColor: 'var(--color-border-soft)' },
};

export default AmountCard;