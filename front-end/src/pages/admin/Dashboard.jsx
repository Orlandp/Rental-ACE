import React, { useState, useEffect } from 'react';

const mockAdmin = {
  name: 'James Orlando',
  property: 'Ace Apartments',
  location: 'Eldoret',
};

const mockUnits = [
  { id: 1, number: 1, tenant: 'James Orlando', rent: 12000, status: 'occupied',  payment_status: 'paid'   },
  { id: 2, number: 2, tenant: 'Sarah Akinyi',  rent: 15000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 3, number: 3, tenant: 'Peter Otieno',  rent: 18000, status: 'occupied',  payment_status: 'paid'   },
  { id: 4, number: 4, tenant: 'Mary Wanjiku',  rent: 20000, status: 'occupied',  payment_status: 'paid'   },
  { id: 5, number: 5, tenant: 'David Mwangi',  rent: 22000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 6, number: 6, tenant: 'Grace Njeri',   rent: 25000, status: 'occupied',  payment_status: 'paid'   },
  { id: 7, number: 7, tenant: 'Paul Odhiambo', rent: 28000, status: 'occupied',  payment_status: 'paid'   },
  { id: 8, number: 8, tenant: 'Ann Chebet',    rent: 28000, status: 'occupied',  payment_status: 'unpaid' },
  { id: 9, number: 9, tenant: 'Admin Unit',    rent: 28000, status: 'occupied',  payment_status: 'paid'   },
];

const mockPending = [
  { id: 1, name: 'Tom Kipchoge', phone: '0712111222', house: 4, date: '1 Jul 2026' },
  { id: 2, name: 'Faith Cherop', phone: '0712333444', house: 6, date: '1 Jul 2026' },
];

const mockRecentPayments = [
  { id: 1, tenant: 'James Orlando', house: 1, amount: 12000, date: '1 Jul 2026', status: 'paid'   },
  { id: 2, tenant: 'Sarah Akinyi',  house: 2, amount: 15000, date: '1 Jul 2026', status: 'unpaid' },
  { id: 3, tenant: 'Peter Otieno',  house: 3, amount: 18000, date: '1 Jul 2026', status: 'paid'   },
];

function AdminDashboard() {

  const [admin, setAdmin]           = useState(null);
  const [units, setUnits]           = useState([]);
  const [pending, setPending]       = useState([]);
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [isDesktop, setIsDesktop]   = useState(window.innerWidth >= 768);

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
        setAdmin(mockAdmin);
        setUnits(mockUnits);
        setPending(mockPending);
        setPayments(mockRecentPayments);
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalUnits     = units.length;
  const occupiedUnits  = units.filter(u => u.status === 'occupied').length;
  const availableUnits = units.filter(u => u.status === 'available').length;
  const pendingCount   = pending.length;

  function handleLogout() {
    window.location.href = '/login';
  }

  function handleApprove(id) {
    setPending(pending.filter(p => p.id !== id));
    alert('Tenant approved! SMS will be sent in backend phase.');
  }

  function handleReject(id) {
    setPending(pending.filter(p => p.id !== id));
    alert('Tenant rejected! SMS will be sent in backend phase.');
  }

  function getPaymentColor(status) {
    if (status === 'paid')   return '#1a7a4a';
    if (status === 'unpaid') return '#c0392b';
    return '#888';
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'units',     label: 'Units',     icon: '🏘️' },
    { key: 'tenants',   label: 'Tenants',   icon: '👥' },
    { key: 'payments',  label: 'Payments',  icon: '💰' },
    { key: 'expenses',  label: 'Expenses',  icon: '🧾' },
    { key: 'messages',  label: 'Messages',  icon: '💬' },
    { key: 'water',     label: 'Water Bills', icon: '💧' },
    { key: 'qrcodes',   label: 'QR Codes',  icon: '📱' },
  ];

  if (loading) {
    return (
      <div style={styles.centered}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <p style={{ color: '#c0392b' }}>⚠ {error}</p>
      </div>
    );
  }

  function DashboardContent() {
    return (
      <div>

        {/* Summary Cards */}
        <div style={styles.summaryRow}>
          {[
            { value: totalUnits,    label: 'Total Units', color: '#1a7a4a' },
            { value: occupiedUnits,  label: 'Occupied',   color: '#1a7a4a' },
            { value: availableUnits, label: 'Available',  color: '#1a7a4a' },
            { value: pendingCount,   label: 'Pending',    color: '#f57c00' },
          ].map((card) => (
            <div key={card.label} style={styles.summaryCard}>
              <p style={{ ...styles.summaryValue, color: card.color }}>
                {card.value}
              </p>
              <p style={styles.summaryLabel}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Quick Actions</p>
          <div style={styles.actionsRow}>
            <button onClick={() => setActivePage('expenses')} style={styles.actionBtn}>
              + Expense
            </button>
            <button onClick={() => setActivePage('messages')} style={styles.actionBtn}>
              💬 Message
            </button>
            <button onClick={() => setActivePage('water')} style={styles.actionBtn}>
              💧 Water Bills
            </button>
            <button
              onClick={() => setActivePage('dashboard')}
              style={{ ...styles.actionBtn, backgroundColor: '#fff8e1', color: '#f57c00', border: '1px solid #ffe082' }}
            >
              ✅ Approvals {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={isDesktop ? styles.contentRow : {}}>

          {/* Recent Payments */}
          <div style={{ ...styles.card, flex: 1 }}>
            <p style={styles.cardTitle}>Recent Payments</p>
            {payments.map((payment) => (
              <div key={payment.id} style={styles.paymentRow}>
                <div>
                  <p style={styles.paymentTenant}>{payment.tenant}</p>
                  <p style={styles.paymentDate}>
                    House {payment.house} · {payment.date}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.paymentAmount}>
                    Ksh {payment.amount.toLocaleString()}
                  </p>
                  <p style={{ ...styles.paymentStatus, color: getPaymentColor(payment.status) }}>
                    {payment.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          {pendingCount > 0 && (
            <div style={{ ...styles.card, flex: 1 }}>
              <p style={styles.cardTitle}>Pending ({pendingCount})</p>
              {pending.map((tenant) => (
                <div key={tenant.id} style={styles.pendingRow}>
                  <div>
                    <p style={styles.pendingName}>{tenant.name}</p>
                    <p style={styles.pendingDetails}>
                      House {tenant.house} · {tenant.phone}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                      {tenant.date}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApprove(tenant.id)} style={styles.approveBtn}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(tenant.id)} style={styles.rejectBtn}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.headerLabel}>Admin</p>
            <h2 style={styles.headerName}>{admin.name}</h2>
            <p style={styles.headerSub}>
              {admin.property} · {admin.location}
            </p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        {/* Mobile Top Nav */}
        {!isDesktop && (
          <div style={styles.mobileNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  ...styles.mobileNavBtn,
                  backgroundColor: activePage === item.key
                    ? 'rgba(255,255,255,0.3)'
                    : 'transparent',
                  fontWeight: activePage === item.key ? 700 : 400,
                }}
              >
                {item.icon} {item.label}
                {item.key === 'dashboard' && pendingCount > 0 && (
                  <span style={styles.badge}> {pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={isDesktop ? styles.bodyDesktop : styles.bodyMobile}>

        {/* Desktop Sidebar */}
        {isDesktop && (
          <div style={styles.sidebar}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  ...styles.sidebarBtn,
                  backgroundColor: activePage === item.key
                    ? 'rgba(255,255,255,0.15)'
                    : 'transparent',
                  fontWeight: activePage === item.key ? 700 : 400,
                  borderLeft: activePage === item.key
                    ? '4px solid white'
                    : '4px solid transparent',
                }}
              >
                {item.icon} {item.label}
                {item.key === 'dashboard' && pendingCount > 0 && (
                  <span style={styles.badge}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div style={isDesktop ? styles.mainDesktop : styles.mainMobile}>

          {activePage === 'dashboard' && <DashboardContent />}

          {activePage !== 'dashboard' && (
            <div style={styles.card}>
              <p style={styles.cardTitle}>
                {navItems.find(n => n.key === activePage)?.label}
              </p>
              <p style={styles.placeholderText}>
                This section is coming next!
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

const GREEN       = '#1a7a4a';
const DARK_GREEN  = '#145f38';

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
    padding: '20px 24px 0',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
  },
  headerLabel: {
    fontSize: '11px',
    opacity: 0.8,
    margin: '0 0 4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  headerName: { fontSize: '20px', fontWeight: 700, margin: '0 0 2px' },
  headerSub: { fontSize: '13px', opacity: 0.8, margin: 0 },
  logoutBtn: {
    padding: '8px 18px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
  },

  mobileNav: {
    display: 'flex',
    overflowX: 'auto',
    gap: '4px',
    paddingBottom: '0',
  },
  mobileNavBtn: {
    padding: '10px 14px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  badge: {
    backgroundColor: '#f57c00',
    color: 'white',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '11px',
    marginLeft: '4px',
  },

  bodyDesktop: {
    display: 'flex',
    flex: 1,
  },
  bodyMobile: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },

  sidebar: {
    width: '220px',
    minWidth: '220px',
    backgroundColor: DARK_GREEN,
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarBtn: {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.2s',
  },

  mainDesktop: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  mainMobile: {
    flex: 1,
    padding: '16px',
  },

  contentRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
  },
  summaryCard: {
    flex: '1 1 120px',
    background: 'white',
    borderRadius: '12px',
    padding: '20px 16px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 4px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
    textTransform: 'uppercase',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    marginBottom: '20px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '10px 16px',
    backgroundColor: '#e8f5ee',
    color: GREEN,
    border: '1px solid #b8dfc9',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  paymentTenant: { fontSize: '14px', fontWeight: 600, margin: '0 0 2px', color: '#1a1a1a' },
  paymentDate: { fontSize: '12px', color: '#888', margin: 0 },
  paymentAmount: { fontSize: '14px', fontWeight: 600, margin: '0 0 2px', color: '#1a1a1a' },
  paymentStatus: { fontSize: '11px', fontWeight: 700, margin: 0 },
  pendingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  pendingName: { fontSize: '14px', fontWeight: 600, margin: '0 0 2px', color: '#1a1a1a' },
  pendingDetails: { fontSize: '12px', color: '#555', margin: '0 0 2px' },
  approveBtn: {
    padding: '8px 14px',
    backgroundColor: GREEN,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '8px 14px',
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  placeholderText: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    padding: '40px 0',
  },
};

export default AdminDashboard;
