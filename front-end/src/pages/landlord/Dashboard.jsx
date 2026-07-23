import React, { useState, useEffect } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function LandlordDashboard() {

  const [landlord, setLandlord]         = useState(null);
  const [units, setUnits]               = useState([]);
  const [tenants, setTenants]           = useState([]);
  const [allPayments, setAllPayments]   = useState([]);
  const [allExpenses, setAllExpenses]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activePage, setActivePage]     = useState('dashboard');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`);
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
        const meRes = await fetch('http://localhost:5000/api/auth/me', { credentials: 'include' });
        const me = await meRes.json();
        if (meRes.ok) setLandlord(me);

        const unitsRes = await fetch('http://localhost:5000/api/units', { credentials: 'include' });
        const unitsData = await unitsRes.json();
        if (unitsRes.ok) setUnits(unitsData);

        const tenantsRes = await fetch('http://localhost:5000/api/tenants', { credentials: 'include' });
        const tenantsData = await tenantsRes.json();
        if (tenantsRes.ok) setTenants(tenantsData);

        const paymentsRes = await fetch('http://localhost:5000/api/payments', { credentials: 'include' });
        const paymentsData = await paymentsRes.json();
        if (paymentsRes.ok) setAllPayments(paymentsData);

        const expensesRes = await fetch('http://localhost:5000/api/expenses', { credentials: 'include' });
        const expensesData = await expensesRes.json();
        if (expensesRes.ok) setAllExpenses(expensesData);
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const availableMonths = [...new Set(allPayments.map((p) => p.month))];
  if (!availableMonths.includes(selectedMonth)) availableMonths.unshift(selectedMonth);

  const monthPayments = allPayments.filter((p) => p.month === selectedMonth);
  const monthExpenses = allExpenses.filter((e) => {
    const parts = selectedMonth.split(' ');
    const year = parts[parts.length - 1];
    return e.expense_date && e.expense_date.startsWith(year);
  });

  const expectedIncome  = units.reduce((sum, u) => sum + u.rent_amount, 0);
  const collectedIncome = monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const outstanding     = expectedIncome - collectedIncome;
  const totalExpenses   = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome       = collectedIncome - totalExpenses;

  const totalUnits     = units.length;
  const occupiedUnits  = units.filter(u => (u.status || '').toUpperCase() === 'OCCUPIED').length;
  const availableUnits = units.filter(u => (u.status || '').toUpperCase() === 'AVAILABLE').length;

  function getCategoryStyle(category) {
    if (category === 'Repairs')   return { bg: '#fdecea', color: '#c0392b' };
    if (category === 'Cleaning')  return { bg: '#e8f4fd', color: '#2980b9' };
    if (category === 'Utilities') return { bg: '#fff8e1', color: '#f57c00' };
    if (category === 'Security')  return { bg: '#f3e5f5', color: '#8e24aa' };
    return                               { bg: '#f4f6f8', color: '#555'    };
  }

  function handleLogout() { window.location.href = '/login'; }

  function parseMonthYear(monthYearStr) {
    const parts = monthYearStr.split(' ');
    return { month: parts[0], year: parts[1] };
  }

  async function handleDownloadPDF() {
    const { month, year } = parseMonthYear(selectedMonth);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/pdf?month=${month}&year=${year}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate PDF report.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-ace-report-${month}-${year}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadExcel() {
    const { month, year } = parseMonthYear(selectedMonth);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/excel?month=${month}&year=${year}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        alert('Could not generate Excel report.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-ace-report-${month}-${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not reach the server.');
    }
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
            <h2 style={styles.headerName}>{landlord?.full_name}</h2>
            <p style={styles.headerSub}>Ace Apartments · Eldoret</p>
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
                { label: `Income (${selectedMonth.split(' ')[0]})`, value: `${(collectedIncome/1000).toFixed(0)}K` },
              ].map((card) => (
                <div key={card.label} style={styles.summaryCard}>
                  <p style={styles.summaryValue}>{card.value}</p>
                  <p style={styles.summaryLabel}>{card.label}</p>
                </div>
              ))}
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Units Overview</p>
              {units.map((unit) => {
                const occupant = tenants.find((t) => t.unit_id === unit.unit_id && t.status === 'active');
                const payment = allPayments.find((p) => p.unit_number === unit.unit_number && p.month === selectedMonth);
                return (
                  <div key={unit.unit_id} style={styles.unitRow}>
                    <div style={styles.unitLeft}>
                      <div style={styles.unitBadge}>H{unit.unit_number}</div>
                      <div>
                        <p style={styles.unitTenant}>{occupant ? occupant.full_name : 'Available'}</p>
                        <p style={styles.unitRent}>Ksh {unit.rent_amount.toLocaleString()}</p>
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
                    monthExpenses.map((expense) => {
                      const catStyle = getCategoryStyle(expense.category);
                      return (
                        <div key={expense.expense_id} style={styles.expenseRow}>
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
                  {units.map((unit) => {
                    const occupant = tenants.find((t) => t.unit_id === unit.unit_id && t.status === 'active');
                    const payment = monthPayments.find((p) => p.unit_number === unit.unit_number);
                    return (
                      <div key={unit.unit_id} style={styles.unitRow}>
                        <div style={styles.unitLeft}>
                          <div style={styles.unitBadge}>H{unit.unit_number}</div>
                          <div>
                            <p style={styles.unitTenant}>{occupant ? occupant.full_name : 'Available'}</p>
                            <p style={styles.unitRent}>Ksh {unit.rent_amount.toLocaleString()}</p>
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

const GREEN = '#1a7a4a';

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