import React, { useState, useEffect } from 'react';

const mockLandlord = {
  name: 'Chris Nyaware',
  property: 'Ace Apartments',
  location: 'Eldoret',
};

const mockUnits = [
  { id: 1, number: 1, tenant: 'James Orlando', rent: 12000, status: 'occupied' },
  { id: 2, number: 2, tenant: 'Sarah Akinyi',  rent: 15000, status: 'occupied' },
  { id: 3, number: 3, tenant: 'Peter Otieno',  rent: 18000, status: 'occupied' },
  { id: 4, number: 4, tenant: 'Mary Wanjiku',  rent: 20000, status: 'occupied' },
  { id: 5, number: 5, tenant: 'David Mwangi',  rent: 22000, status: 'occupied' },
  { id: 6, number: 6, tenant: 'Grace Njeri',   rent: 25000, status: 'occupied' },
  { id: 7, number: 7, tenant: 'Paul Odhiambo', rent: 28000, status: 'occupied' },
  { id: 8, number: 8, tenant: 'Ann Chebet',    rent: 28000, status: 'occupied' },
  { id: 9, number: 9, tenant: 'Admin Unit',    rent: 28000, status: 'occupied' },
];

const mockPaymentsByMonth = {
  'July 2026': [
    { unit: 1, amount: 12000, status: 'paid'   },
    { unit: 2, amount: 15000, status: 'unpaid' },
    { unit: 3, amount: 18000, status: 'paid'   },
    { unit: 4, amount: 20000, status: 'paid'   },
    { unit: 5, amount: 22000, status: 'unpaid' },
    { unit: 6, amount: 25000, status: 'paid'   },
    { unit: 7, amount: 28000, status: 'paid'   },
    { unit: 8, amount: 28000, status: 'unpaid' },
    { unit: 9, amount: 28000, status: 'paid'   },
  ],
  'June 2026': [
    { unit: 1, amount: 12000, status: 'paid'   },
    { unit: 2, amount: 15000, status: 'paid'   },
    { unit: 3, amount: 18000, status: 'paid'   },
    { unit: 4, amount: 20000, status: 'paid'   },
    { unit: 5, amount: 22000, status: 'paid'   },
    { unit: 6, amount: 25000, status: 'paid'   },
    { unit: 7, amount: 28000, status: 'paid'   },
    { unit: 8, amount: 28000, status: 'unpaid' },
    { unit: 9, amount: 28000, status: 'paid'   },
  ],
};

const mockExpensesByMonth = {
  'July 2026': [
    { category: 'Repairs',  amount: 5000, description: 'Roof repair unit 3' },
    { category: 'Cleaning', amount: 2000, description: 'Common area'        },
    { category: 'Security', amount: 8000, description: 'Guard salary'       },
  ],
  'June 2026': [
    { category: 'Utilities', amount: 3000, description: 'Electricity bill'  },
    { category: 'Security',  amount: 8000, description: 'Guard salary'      },
  ],
};

const availableMonths = ['July 2026', 'June 2026'];

function LandlordDashboard() {

  const [landlord, setLandlord]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activePage, setActivePage]     = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [isDesktop, setIsDesktop]       = useState(window.innerWidth >= 768);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLandlord(mockLandlord);
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const monthPayments = mockPaymentsByMonth[selectedMonth] || [];
  const monthExpenses = mockExpensesByMonth[selectedMonth] || [];

  const expectedIncome  = mockUnits.reduce((sum, u) => sum + u.rent, 0);
  const collectedIncome = monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const outstanding     = expectedIncome - collectedIncome;
  const totalExpenses   = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome       = collectedIncome - totalExpenses;

  const totalUnits     = mockUnits.length;
  const occupiedUnits  = mockUnits.filter(u => u.status === 'occupied').length;
  const availableUnits = mockUnits.filter(u => u.status === 'available').length;

  function getCategoryStyle(category) {
    if (category === 'Repairs')   return { bg: '#fdecea', color: '#c0392b' };
    if (category === 'Cleaning')  return { bg: '#e8f4fd', color: '#2980b9' };
    if (category === 'Utilities') return { bg: '#fff8e1', color: '#f57c00' };
    if (category === 'Security')  return { bg: '#f3e5f5', color: '#8e24aa' };
    return                               { bg: '#f4f6f8', color: '#555'    };
  }

  function handleLogout() { window.location.href = '/login'; }

  function handleDownloadPDF() {
    alert('PDF generation coming in backend phase!\n\nFlask will use ReportLab to generate a PDF with income charts and payment tables.');
  }

  function handleDownloadExcel() {
    alert('Excel generation coming in backend phase!\n\nFlask will use openpyxl to generate a detailed spreadsheet.');
  }

  if (loading) return <div style={styles.centered}><p>Loading...</p></div>;
  if (error)   return <div style={styles.centered}><p style={{ color: '#c0392b' }}>⚠ {error}</p></div>;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.headerLabel}>Landlord</p>
            <h2 style={styles.headerName}>{landlord.name}</h2>
            <p style={styles.headerSub}>{landlord.property} · {landlord.location}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>

        {/* Navigation */}
        <div style={styles.nav}>
          {['dashboard', 'reports'].map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              style={{
                ...styles.navBtn,
                backgroundColor: activePage === page
                  ? 'rgba(255,255,255,0.3)'
                  : 'transparent',
                fontWeight: activePage === page ? 700 : 400,
              }}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={isDesktop ? styles.bodyDesktop : styles.bodyMobile}>

        {/* DASHBOARD PAGE */}
        {activePage === 'dashboard' && (
          <div style={styles.content}>

            <div style={styles.summaryRow}>
              {[
                { label: 'Total Units',  value: totalUnits    },
                { label: 'Occupied',     value: occupiedUnits  },
                { label: 'Available',    value: availableUnits },
                { label: 'Income (Jul)', value: `${(collectedIncome/1000).toFixed(0)}K` },
              ].map((card) => (
                <div key={card.label} style={styles.summaryCard}>
                  <p style={styles.summaryValue}>{card.value}</p>
                  <p style={styles.summaryLabel}>{card.label}</p>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Units Overview</p>
              {mockUnits.map((unit) => {
                const payment = (mockPaymentsByMonth['July 2026'] || []).find(p => p.unit === unit.number);
                return (
                  <div key={unit.id} style={styles.unitRow}>
                    <div style={styles.unitLeft}>
                      <div style={styles.unitBadge}>H{unit.number}</div>
                      <div>
                        <p style={styles.unitTenant}>{unit.tenant || 'Available'}</p>
                        <p style={styles.unitRent}>Ksh {unit.rent.toLocaleString()}</p>
                      </div>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: payment?.status === 'paid' ? '#1a7a4a' : '#c0392b',
                      margin: 0,
                    }}>
                      {payment ? payment.status.toUpperCase() : '——'}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* REPORTS PAGE */}
        {activePage === 'reports' && (
          <div style={styles.content}>

            {/* Month Selector */}
            <div style={styles.card}>
              <div style={styles.monthRow}>
                <div>
                  <p style={styles.cardTitle}>Financial Report</p>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                    Select a month to view its report
                  </p>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={styles.monthSelect}
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Income Summary Cards */}
            <div style={styles.summaryRow}>
              <div style={styles.summaryCard}>
                <p style={{ ...styles.summaryValue, color: '#1a1a1a' }}>
                  Ksh {expectedIncome.toLocaleString()}
                </p>
                <p style={styles.summaryLabel}>Expected</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={{ ...styles.summaryValue, color: '#1a7a4a' }}>
                  Ksh {collectedIncome.toLocaleString()}
                </p>
                <p style={styles.summaryLabel}>Collected</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={{ ...styles.summaryValue, color: '#c0392b' }}>
                  Ksh {outstanding.toLocaleString()}
                </p>
                <p style={styles.summaryLabel}>Outstanding</p>
              </div>
            </div>

            {/* Income vs Expenses + Unit Breakdown */}
            <div style={isDesktop ? styles.twoColRow : {}}>

              <div style={{ flex: 1 }}>
                {/* Net Income Card */}
                <div style={styles.card}>
                  <p style={styles.cardTitle}>Income vs Expenses</p>

                  <div style={styles.reportRow}>
                    <p style={styles.reportLabel}>Collected Income</p>
                    <p style={{ ...styles.reportValue, color: '#1a7a4a' }}>
                      Ksh {collectedIncome.toLocaleString()}
                    </p>
                  </div>
                  <div style={styles.reportRow}>
                    <p style={styles.reportLabel}>Total Expenses</p>
                    <p style={{ ...styles.reportValue, color: '#c0392b' }}>
                      Ksh {totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div style={{ ...styles.reportRow, borderTop: '2px solid #f0f0f0', paddingTop: '16px', marginTop: '8px' }}>
                    <p style={{ ...styles.reportLabel, fontWeight: 700, color: '#1a1a1a', fontSize: '15px' }}>
                      Net Income
                    </p>
                    <p style={{ ...styles.reportValue, color: '#1a7a4a', fontSize: '20px', fontWeight: 700 }}>
                      Ksh {netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Expenses Breakdown */}
                <div style={styles.card}>
                  <p style={styles.cardTitle}>Expenses Breakdown</p>
                  {monthExpenses.length === 0 ? (
                    <p style={styles.placeholderText}>No expenses for {selectedMonth}</p>
                  ) : (
                    monthExpenses.map((expense, index) => {
                      const catStyle = getCategoryStyle(expense.category);
                      return (
                        <div key={index} style={styles.expenseRow}>
                          <span style={{
                            ...styles.categoryBadge,
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                          }}>
                            {expense.category}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={styles.expenseDesc}>{expense.description}</p>
                          </div>
                          <p style={styles.expenseAmount}>
                            Ksh {expense.amount.toLocaleString()}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Unit Breakdown */}
              <div style={{ flex: 1 }}>
                <div style={styles.card}>
                  <p style={styles.cardTitle}>Unit Breakdown — {selectedMonth}</p>
                  {mockUnits.map((unit) => {
                    const payment = monthPayments.find(p => p.unit === unit.number);
                    return (
                      <div key={unit.id} style={styles.unitRow}>
                        <div style={styles.unitLeft}>
                          <div style={styles.unitBadge}>H{unit.number}</div>
                          <div>
                            <p style={styles.unitTenant}>{unit.tenant || 'Available'}</p>
                            <p style={styles.unitRent}>Ksh {unit.rent.toLocaleString()}</p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: payment?.status === 'paid' ? '#e8f5ee' : '#fdecea',
                          color: payment?.status === 'paid' ? '#1a7a4a' : '#c0392b',
                        }}>
                          {payment ? payment.status.toUpperCase() : '——'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Download Buttons */}
            <div style={styles.downloadRow}>
              <button onClick={handleDownloadPDF} style={styles.pdfBtn}>
                📄 Download PDF Report
              </button>
              <button onClick={handleDownloadExcel} style={styles.excelBtn}>
                📊 Download Excel Sheet
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

const GREEN      = '#1a7a4a';
const DARK_GREEN = '#145f38';

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
  header: {
    backgroundColor: GREEN,
    color: 'white',
    padding: '24px 32px 0',
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
  headerName: { fontSize: '22px', fontWeight: 700, margin: '0 0 4px' },
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
    cursor: 'pointer',
  },
  bodyDesktop: {
    flex: 1,
    padding: '0',
  },
  bodyMobile: {
    flex: 1,
  },
  content: {
    padding: '24px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  twoColRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
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
    fontSize: '24px',
    fontWeight: 700,
    color: GREEN,
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
    marginBottom: '20px',
    padding: '24px',
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
  monthRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  monthSelect: {
    padding: '10px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  reportRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  reportLabel: { fontSize: '14px', color: '#555', margin: 0 },
  reportValue: { fontSize: '15px', fontWeight: 600, margin: 0 },
  unitRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  unitLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  unitBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#e8f5ee',
    color: GREEN,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    minWidth: '40px',
  },
  unitTenant: { fontSize: '14px', fontWeight: 600, margin: '0 0 2px', color: '#1a1a1a' },
  unitRent: { fontSize: '12px', color: '#888', margin: 0 },
  expenseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  expenseDesc: { fontSize: '13px', color: '#555', margin: 0 },
  expenseAmount: { fontSize: '14px', fontWeight: 700, color: '#c0392b', margin: 0, whiteSpace: 'nowrap' },
  downloadRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '32px',
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
    minWidth: '160px',
  },
  excelBtn: {
    flex: 1,
    padding: '16px',
    backgroundColor: GREEN,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '160px',
  },
  placeholderText: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    padding: '32px 0',
  },
};

export default LandlordDashboard;