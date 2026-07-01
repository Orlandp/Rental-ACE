import React from 'react';

function TopBar({ houseId }) {
  return (
    <div style={styles.topBar}>
      <p style={styles.label}>Your Rental</p>
      <h1 style={styles.house}>House {houseId}</h1>
      <p style={styles.address}>Ace Apartments · Eldoret</p>
    </div>
  );
}

const styles = {
  topBar: {
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '32px 20px 40px',
    textAlign: 'center',
  },
  label: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 6px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  house: {
    fontSize: '32px',
    fontWeight: 600,
    margin: '0 0 6px',
  },
  address: {
    fontSize: '13px',
    opacity: 0.75,
    margin: 0,
  },
};

export default TopBar;