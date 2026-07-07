import React, { useEffect, useState } from 'react';

const mockLandlord = {
    name: 'Chris Nyaware',
    property: 'Ace Apartments',
    location: 'Eldoret',
}

const mockUnits = [
   { id: 1, number: 1, tenant: 'James Orlando', rent: 12000, status: 'occupied',  payment_status: 'paid'   },
  { id: 2, number: 2, tenant: 'Sarah Akinyi',  rent: 15000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 3, number: 3, tenant: 'Peter Otieno',  rent: 18000, status: 'occupied',  payment_status: 'paid'   },
  { id: 4, number: 4, tenant: 'Mary Wanjiku',  rent: 20000, status: 'occupied',  payment_status: 'paid'   },
  { id: 5, number: 5, tenant: 'David Mwangi',  rent: 22000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 6, number: 6, tenant: 'Grace Njeri',   rent: 25000, status: 'occupied',  payment_status: 'paid'   },
  { id: 7, number: 7, tenant: 'Paul Odhiambo', rent: 28000, status: 'occupied',  payment_status: 'paid'   },
  { id: 8, number: 8, tenant: 'Ann Chebet',    rent: 28000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 9, number: 9, tenant: null,            rent: 28000, status: 'available', payment_status: null     },
];

const mockPayments = [ 
     { id: 1, unit: 1, amount: 12000, month: 'July 2026' },
  { id: 2, unit: 3, amount: 18000, month: 'July 2026' },
  { id: 3, unit: 4, amount: 20000, month: 'July 2026' },
  { id: 4, unit: 6, amount: 25000, month: 'July 2026' },
  { id: 5, unit: 7, amount: 28000, month: 'July 2026' },
];

const mockExpenses = [
    { id: 1, description: 'Water Bill', amount: 5000, date: '2026-07-05' },
    { id: 2, description: 'Electricity Bill', amount: 8000, date: '2026-07-10' },
    { id: 3, description: 'Maintenance', amount: 12000, date: '2026-07-15' },
];

function LandlordDashboard() {
    const [landlord, setLandlord] = useState(null);
    const [units, setUnits] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activePage, setActivePage] = useState('dashboard');

    useEffect(() =>{
        async function LoadData() {
            try {
                setLandlord(mockLandlord);
                setUnits(mockUnits);
                setPayments(mockPayments);
                setExpenses(mockExpenses);
            } catch (err) {
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        }
    LoadData();
    },[]);
    const totalUnits     = units.length;
  const occupiedUnits  = units.filter(u => u.status === 'occupied').length;
  const availableUnits = units.filter(u => u.status === 'available').length;
  const totalIncome    = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses  = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome      = totalIncome - totalExpenses;

  function handleLogout() {
    window.location.href = '/login';
  }

  function handleDownloadPDF() {
    alert('PDF download coming in backend phase!');
  }

  function handleDownloadExcel() {
    alert('Excel download coming in backend phase!');
  }

  function getPaymentColor(status) {
    if (status === 'paid')   return '#1a7a4a';
    if (status === 'unpaid') return '#c0392b';
    return '#888';
  }
  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading dashboard...</p>
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
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.headerLabel}>Landlord</p>
            <h2 style={styles.headerName}>{landlord.name}</h2>
            <p style={styles.headerSub}>
              {landlord.property} · {landlord.location}
            </p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        {/* Navigation */}
        <div style={styles.nav}>
          <button
            onClick={() => setActivePage('dashboard')}
            style={{
              ...styles.navBtn,
              backgroundColor: activePage === 'dashboard' ? 'rgba(255,255,255,0.3)' : 'transparent',
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActivePage('reports')}
            style={{
              ...styles.navBtn,
              backgroundColor: activePage === 'reports' ? 'rgba(255,255,255,0.3)' : 'transparent',
            }}
          >
            Reports
          </button>
        </div>
      </div>

      {/* DASHBOARD PAGE */}
      {activePage === 'dashboard' && (
        <div>

          {/* Summary Cards */}
          <div style={styles.summaryRow}>
            <div style={styles.summaryCard}>
              <p style={styles.summaryValue}>{totalUnits}</p>
              <p style={styles.summaryLabel}>Total Units</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryValue}>{occupiedUnits}</p>
              <p style={styles.summaryLabel}>Occupied</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryValue}>{availableUnits}</p>
              <p style={styles.summaryLabel}>Available</p>
            </div>
            <div style={styles.summaryCard}>
              <p style={styles.summaryValue}>
                {(totalIncome / 1000).toFixed(0)}K
              </p>
              <p style={styles.summaryLabel}>Income</p>
            </div>
          </div>

          {/* Units Overview */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Units Overview</p>
            {units.map((unit) => (
              <div key={unit.id} style={styles.unitRow}>
                <div style={styles.unitLeft}>
                  <div style={styles.unitBadge}>
                    H{unit.number}
                  </div>
                  <div>
                    <p style={styles.unitTenant}>
                      {unit.tenant || 'Available'}
                    </p>
                    <p style={styles.unitRent}>
                      Ksh {unit.rent.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p style={{
                  ...styles.unitStatus,
                  color: getPaymentColor(unit.payment_status)
                }}>
                  {unit.payment_status
                    ? unit.payment_status.toUpperCase()
                    : '——'}
                </p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* REPORTS PAGE */}
      {activePage === 'reports' && (
        <div>

          {/* Income vs Expenses */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Income vs Expenses</p>

            <div style={styles.reportRow}>
              <p style={styles.reportLabel}>Total Collected</p>
              <p style={{ ...styles.reportValue, color: '#1a7a4a' }}>
                Ksh {totalIncome.toLocaleString()}
              </p>
            </div>

            <div style={styles.reportRow}>
              <p style={styles.reportLabel}>Total Expenses</p>
              <p style={{ ...styles.reportValue, color: '#c0392b' }}>
                Ksh {totalExpenses.toLocaleString()}
              </p>
            </div>

            <div style={{ ...styles.reportRow, borderTop: '2px solid #f0f0f0', paddingTop: '12px' }}>
              <p style={{ ...styles.reportLabel, fontWeight: 700 }}>Net Income</p>
              <p style={{ ...styles.reportValue, color: '#1a7a4a', fontWeight: 700 }}>
                Ksh {netIncome.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>Expenses Breakdown</p>
            {expenses.map((expense) => (
              <div key={expense.id} style={styles.reportRow}>
                <div>
                  <p style={styles.reportLabel}>{expense.description}</p>
                  <p style={styles.expenseDesc}>{expense.date}</p>
                </div>
                <p style={{ ...styles.reportValue, color: '#c0392b' }}>
                  Ksh {expense.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Download Buttons */}
          <div style={styles.downloadRow}>
            <button
              onClick={handleDownloadPDF}
              style={styles.pdfBtn}
            >
              📄 Download PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              style={styles.excelBtn}
            >
              📊 Download Excel
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  errorText: { color: '#c0392b', fontSize: '15px', textAlign: 'center' },
  header: {
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '28px 32px 0',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 6px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  headerName: { fontSize: '24px', fontWeight: 700, margin: '0 0 4px' },
  headerSub: { fontSize: '14px', opacity: 0.8, margin: 0 },
  logoutBtn: {
    padding: '10px 22px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    gap: '4px',
  },
  navBtn: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '24px',
  },
  summaryCard: {
    flex: '1 1 140px',
    background: 'white',
    borderRadius: '14px',
    padding: '20px 16px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a7a4a',
    margin: '0 0 6px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    margin: '0 24px 24px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  unitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  unitLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  unitBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: '#e8f5ee',
    color: '#1a7a4a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
  },
  unitTenant: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: '#1a1a1a' },
  unitRent: { fontSize: '13px', color: '#888', margin: 0 },
  unitStatus: { fontSize: '13px', fontWeight: 700 },
  reportRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  reportLabel: { fontSize: '15px', color: '#555', margin: 0 },
  reportValue: { fontSize: '15px', fontWeight: 600, margin: 0 },
  expenseDesc: { fontSize: '12px', color: '#888', margin: '4px 0 0' },
  downloadRow: {
    display: 'flex',
    gap: '16px',
    padding: '0 24px 32px',
    flexWrap: 'wrap',
  },
  pdfBtn: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '140px',
  },
  excelBtn: {
    flex: 1,
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '140px',
  },
};
export default LandlordDashboard;
    
    