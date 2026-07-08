import React, { useState, useEffect } from 'react';

const mockAdmin = { name: 'James Orlando', property: 'Ace Apartments', location: 'Eldoret' };

const mockUnits = [
  { id: 1, number: 1, tenant: 'James Orlando', rent: 12000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'paid' },
  { id: 2, number: 2, tenant: 'Sarah Akinyi', rent: 15000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'unpaid' },
  { id: 3, number: 3, tenant: 'Peter Otieno', rent: 18000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'paid' },
  { id: 4, number: 4, tenant: 'Mary Wanjiku', rent: 20000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'paid' },
  { id: 5, number: 5, tenant: 'David Mwangi', rent: 22000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'unpaid' },
  { id: 6, number: 6, tenant: 'Grace Njeri', rent: 25000, payment_type: 'paybill', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'paid' },
  { id: 7, number: 7, tenant: 'Paul Odhiambo', rent: 28000, payment_type: 'phone', has_water: true, water_bill: 1200, status: 'occupied', payment_status: 'paid' },
  { id: 8, number: 8, tenant: 'Ann Chebet', rent: 28000, payment_type: 'phone', has_water: true, water_bill: 980, status: 'occupied', payment_status: 'unpaid' },
  { id: 9, number: 9, tenant: 'Admin Unit', rent: 28000, payment_type: 'phone', has_water: false, water_bill: 0, status: 'occupied', payment_status: 'paid' },
];

const mockTenants = [
  { id: 1, name: 'James Orlando', username: 'james1', phone: '0712111001', id_number: '11111111', house: 1, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Jan 2026', move_out: null },
  { id: 2, name: 'Sarah Akinyi', username: 'sarah2', phone: '0712111002', id_number: '22222222', house: 2, penalty_date: 10, penalty_rate: 8.0, status: 'active', move_in: '1 Jan 2026', move_out: null },
  { id: 3, name: 'Peter Otieno', username: 'peter3', phone: '0712111003', id_number: '33333333', house: 3, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Feb 2026', move_out: null },
  { id: 4, name: 'Mary Wanjiku', username: 'mary4', phone: '0712111004', id_number: '44444444', house: 4, penalty_date: 10, penalty_rate: 8.0, status: 'active', move_in: '1 Feb 2026', move_out: null },
  { id: 5, name: 'David Mwangi', username: 'david5', phone: '0712111005', id_number: '55555555', house: 5, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Mar 2026', move_out: null },
  { id: 6, name: 'Grace Njeri', username: 'grace6', phone: '0712111006', id_number: '66666666', house: 6, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Mar 2026', move_out: null },
  { id: 7, name: 'Paul Odhiambo', username: 'paul7', phone: '0712111007', id_number: '77777777', house: 7, penalty_date: 10, penalty_rate: 8.0, status: 'active', move_in: '1 Apr 2026', move_out: null },
  { id: 8, name: 'Ann Chebet', username: 'ann8', phone: '0712111008', id_number: '88888888', house: 8, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Apr 2026', move_out: null },
  { id: 9, name: 'Admin Unit', username: 'admin9', phone: '0712111009', id_number: '99999999', house: 9, penalty_date: 5, penalty_rate: 5.0, status: 'active', move_in: '1 Jan 2026', move_out: null },
];

const mockAllPayments = [
  { id: 1, tenant: 'James Orlando', house: 1, amount: 12000, date: '1 Jul 2026', month: 'July 2026', mpesa_code: 'QHX7234KLP', status: 'paid' },
  { id: 2, tenant: 'Sarah Akinyi', house: 2, amount: 15000, date: '1 Jul 2026', month: 'July 2026', mpesa_code: null, status: 'unpaid' },
  { id: 3, tenant: 'Peter Otieno', house: 3, amount: 18000, date: '1 Jul 2026', month: 'July 2026', mpesa_code: 'RKL8923MNP', status: 'paid' },
  { id: 4, tenant: 'Mary Wanjiku', house: 4, amount: 20000, date: '1 Jul 2026', month: 'July 2026', mpesa_code: 'PLM3421QRS', status: 'paid' },
  { id: 5, tenant: 'David Mwangi', house: 5, amount: 22000, date: '1 Jul 2026', month: 'July 2026', mpesa_code: null, status: 'unpaid' },
  { id: 6, tenant: 'Grace Njeri', house: 6, amount: 25000, date: '2 Jul 2026', month: 'July 2026', mpesa_code: 'NKJ9821WXY', status: 'paid' },
  { id: 7, tenant: 'Paul Odhiambo', house: 7, amount: 29200, date: '2 Jul 2026', month: 'July 2026', mpesa_code: 'MHG4532ABC', status: 'paid' },
  { id: 8, tenant: 'Ann Chebet', house: 8, amount: 28980, date: '2 Jul 2026', month: 'July 2026', mpesa_code: null, status: 'unpaid' },
  { id: 9, tenant: 'James Orlando', house: 1, amount: 12000, date: '1 Jun 2026', month: 'June 2026', mpesa_code: 'LKP2341DEF', status: 'paid' },
  { id: 10, tenant: 'Sarah Akinyi', house: 2, amount: 15000, date: '2 Jun 2026', month: 'June 2026', mpesa_code: 'JHG7654MNO', status: 'paid' },
];

const messageTemplates = {
  reminder: 'Dear tenant, your rent is due on the 1st. Please pay via the QR code on your door.',
  confirmed: 'Your payment has been received. Thank you.',
  balance: 'You have an outstanding balance. Please clear it at your earliest convenience.',
  custom: '',
};

const mockExpenses = [
  { id: 1, category: 'Repairs', description: 'Roof repair unit 3', amount: 5000, date: '1 Jul 2026' },
  { id: 2, category: 'Cleaning', description: 'Common area cleaning', amount: 2000, date: '1 Jul 2026' },
  { id: 3, category: 'Security', description: 'Guard salary July', amount: 8000, date: '1 Jul 2026' },
];

const mockPending = [
  { id: 1, name: 'Tom Kipchoge', phone: '0712111222', house: 4, date: '1 Jul 2026' },
  { id: 2, name: 'Faith Cherop', phone: '0712333444', house: 6, date: '1 Jul 2026' },
];

const mockRecentPayments = [
  { id: 1, tenant: 'James Orlando', house: 1, amount: 12000, date: '1 Jul 2026', status: 'paid' },
  { id: 2, tenant: 'Sarah Akinyi', house: 2, amount: 15000, date: '1 Jul 2026', status: 'unpaid' },
  { id: 3, tenant: 'Peter Otieno', house: 3, amount: 18000, date: '1 Jul 2026', status: 'paid' },
];

function AdminDashboard() {
  const [waterHistory, setWaterHistory] = useState([
    { id: 1, month: 'july 2026', amount: 1200, house7: 1200, house8: 980 },
    { id: 2, month: 'june 2026', amount: 1100, house7: 1100, house8: 900 },
    { id: 3, month: 'may 2026', amount: 1000, house7: 1000, house8: 850 },
  ]);
  const [recipient, setRecipient] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWater7, setNewWater7] = useState('');
  const [newWater8, setNewWater8] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [allPayments, setAllPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [admin, setAdmin] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState('dashboard');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editRent, setEditRent] = useState('');
  const [editWater, setEditWater] = useState('');
  const [editingTenant, setEditingTenant] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPenaltyDate, setEditPenaltyDate] = useState('');
  const [editPenaltyRate, setEditPenaltyRate] = useState('');

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
        setExpenses(mockExpenses);
        setTenants(mockTenants);
        setPending(mockPending);
        setPayments(mockRecentPayments);
        setAllPayments(mockAllPayments);
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
  const availableUnits = units.filter((u) => u.status === 'available').length;
  const pendingCount = pending.length;
  const filteredPayments = allPayments.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterMonth !== 'all' && p.month !== filterMonth) return false;
    return true;
  });

  const totalCollected = filteredPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = filteredPayments
    .filter((p) => p.status === 'unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  const availableMonths = [...new Set(allPayments.map((p) => p.month))];

  function handleLogout() {
    window.location.href = '/login';
  }

  function handleApprove(id) {
    setPending(pending.filter((p) => p.id !== id));
    alert('Tenant approved!');
  }

  function handleReject(id) {
    setPending(pending.filter((p) => p.id !== id));
    alert('Tenant rejected!');
  }

  function getPaymentColor(status) {
    if (status === 'paid') return '#1a7a4a';
    if (status === 'unpaid') return '#c0392b';
    return '#888';
  }

  function getStatusColor(status) {
    if (status === 'occupied') return '#1a7a4a';
    if (status === 'available') return '#2980b9';
    if (status === 'vacating') return '#f57c00';
    if (status === 'maintenance') return '#c0392b';
    return '#888';
  }

  function getStatusBg(status) {
    if (status === 'occupied') return '#e8f5ee';
    if (status === 'available') return '#e8f4fd';
    if (status === 'vacating') return '#fff8e1';
    if (status === 'maintenance') return '#fdecea';
    return '#f4f6f8';
  }

  function handleEditUnit(unit) {
    setEditingUnit(unit.id);
    setEditRent(unit.rent);
    setEditWater(unit.water_bill || 0);
  }

  function handleSaveUnit(unitId) {
    setUnits(
      units.map((u) =>
        u.id === unitId
          ? { ...u, rent: parseInt(editRent), water_bill: parseInt(editWater) }
          : u,
      ),
    );
    setEditingUnit(null);
  }

  function handleStatusChange(unitId, newStatus) {
    setUnits(
      units.map((u) => (u.id === unitId ? { ...u, status: newStatus } : u)),
    );
  }

  function handleEditTenant(tenant) {
    setEditingTenant(tenant.id);
    setEditName(tenant.name);
    setEditPhone(tenant.phone);
    setEditPenaltyDate(tenant.penalty_date);
    setEditPenaltyRate(tenant.penalty_rate);
  }

  function handleSaveTenant(tenantId) {
    setTenants(
      tenants.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              name: editName,
              phone: editPhone,
              penalty_date: parseInt(editPenaltyDate),
              penalty_rate: parseFloat(editPenaltyRate),
            }
          : t,
      ),
    );
    setEditingTenant(null);
  }

  function handleVacate(tenantId) {
    const confirmed = window.confirm(
      'Are you sure you want to mark this tenant as vacated?',
    );
    if (!confirmed) return;
    setTenants(
      tenants.map((t) =>
        t.id === tenantId
          ? { ...t, status: 'vacated', move_out: '4 Jul 2026' }
          : t,
      ),
    );
    setUnits(
      units.map((u) =>
        u.number === tenants.find((t) => t.id === tenantId)?.house
          ? { ...u, status: 'available', tenant: null }
          : u,
      ),
    );
  }

  function getCategoryStyle(category) {
    if (category === 'Repairs') return { bg: '#fdecea', color: '#c0392b' };
    if (category === 'Cleaning') return { bg: '#e8f4fd', color: '#2980b9' };
    if (category === 'Utilities') return { bg: '#fff8e1', color: '#f57c00' };
    if (category === 'Security') return { bg: '#f3e5f5', color: '#8e24aa' };
    return { bg: '#f4f6f8', color: '#555' };
  }

  function handleAddExpense() {
    if (!newDescription.trim()) {
      alert('Please enter a description.');
      return;
    }
    if (!newAmount || parseInt(newAmount) < 1) {
      alert('Please enter a valid amount.');
      return;
    }
    const newExpense = {
      id: Date.now(),
      category: newCategory,
      description: newDescription,
      amount: parseInt(newAmount),
      date: new Date().toLocaleDateString('en-KE'),
    };
    setExpenses([...expenses, newExpense]);
    setNewDescription('');
    setNewAmount('');
  }

  function handleDeleteExpense(id) {
    const confirmed = window.confirm('Delete this expense?');
    if (!confirmed) return;
    setExpenses(expenses.filter((e) => e.id !== id));
  }
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = {
    Repairs: expenses
      .filter((e) => e.category === 'Repairs')
      .reduce((sum, e) => sum + e.amount, 0),
    Cleaning: expenses
      .filter((e) => e.category === 'Cleaning')
      .reduce((sum, e) => sum + e.amount, 0),
    Utilities: expenses
      .filter((e) => e.category === 'Utilities')
      .reduce((sum, e) => sum + e.amount, 0),
    Security: expenses
      .filter((e) => e.category === 'Security')
      .reduce((sum, e) => sum + e.amount, 0),
    Other: expenses
      .filter((e) => e.category === 'Other')
      .reduce((sum, e) => sum + e.amount, 0),
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'units', label: 'Units', icon: '🏘️' },
    { key: 'tenants', label: 'Tenants', icon: '👥' },
    { key: 'payments', label: 'Payments', icon: '💰' },
    { key: 'expenses', label: 'Expenses', icon: '🧾' },
    { key: 'messages', label: 'Messages', icon: '💬' },
    { key: 'water', label: 'Water Bills', icon: '💧' },
    { key: 'qrcodes', label: 'QR Codes', icon: '📱' },
  ];

  if (loading)
    return (
      <div style={styles.centered}>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div style={styles.centered}>
        <p style={{ color: '#c0392b' }}>⚠ {error}</p>
      </div>
    );

  function handleTemplateSelect(template) {
    setMessageTemplate(template);
    setMessageText(messageTemplates[template]);
  }

  function handleSendMessage() {
    if (!messageText.trim()) {
      alert('Please enter a message.');
      return;
    }

    const recipientName =
      recipient === 'all'
        ? `All Tenants (${tenants.filter((t) => t.status === 'active').length})`
        : (() => {
            const t = tenants.find((t) => t.id === parseInt(recipient));
            return t ? `${t.name} - H${t.house}` : 'Unknown';
          })();

    const newMessage = {
      id: Date.now(),
      recipient: recipientName,
      content: messageText,
      date: new Date().toLocaleDateString('en-KE'),
      status: 'sent',
    };

    setMessageHistory([newMessage, ...messageHistory]);
    setMessageText('');
    alert(
      `SMS sent to ${recipientName} successfully!\n\nIn backend phase this will use Africa's Talking API.`,
    );
  }
  function handleSaveWaterBill(houseNumber, amount) {
    if(!amount || parseInt(amount) < 1) {
      alert('please enter a valid amount');
      return;
    }

    setUnits(units.map(u =>
    u.number === houseNumber
      ? { ...u, water_bill: parseInt(amount) }
      : u
  ));
  if(houseNumber === 7)setNewWater7('');
  if(houseNumber === 8)setNewWater8('');
   alert(`House ${houseNumber} water bill updated to Ksh ${parseInt(amount).toLocaleString()}!`);
}
function handleSaveMonthlyBills() {
  const house7Bill = units.find( u => u.number === 7)?.water_bill || 0;
  const house8Bill = units.find( u => u.number === 8)?.water_bill || 0;

  const newRecord = {
    id: Date.now(),
    month: 'July 2026',
    house7: house7Bill,
    house8: house8Bill,
  };

  setWaterHistory([newRecord, ...waterHistory]);
  alert('Water bills are saved for the History of July 2026');

}
    
    

  function DashboardContent() {
    return (
      <div>
        <div style={styles.summaryRow}>
          {[
            { value: totalUnits, label: 'Total Units', color: '#1a7a4a' },
            { value: occupiedUnits, label: 'Occupied', color: '#1a7a4a' },
            { value: availableUnits, label: 'Available', color: '#1a7a4a' },
            { value: pendingCount, label: 'Pending', color: '#f57c00' },
          ].map((card) => (
            <div key={card.label} style={styles.summaryCard}>
              <p style={{ ...styles.summaryValue, color: card.color }}>
                {card.value}
              </p>
              <p style={styles.summaryLabel}>{card.label}</p>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Quick Actions</p>
          <div style={styles.actionsRow}>
            <button
              onClick={() => setActivePage('expenses')}
              style={styles.actionBtn}
            >
              + Expense
            </button>
            <button
              onClick={() => setActivePage('messages')}
              style={styles.actionBtn}
            >
              💬 Message
            </button>
            <button
              onClick={() => setActivePage('water')}
              style={styles.actionBtn}
            >
              💧 Water Bills
            </button>
            <button
              onClick={() => setActivePage('dashboard')}
              style={{
                ...styles.actionBtn,
                backgroundColor: '#fff8e1',
                color: '#f57c00',
                border: '1px solid #ffe082',
              }}
            >
              ✅ Approvals {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        <div style={isDesktop ? styles.contentRow : {}}>
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
                  <p
                    style={{
                      ...styles.paymentStatus,
                      color: getPaymentColor(payment.status),
                    }}
                  >
                    {payment.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>

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
                    <button
                      onClick={() => handleApprove(tenant.id)}
                      style={styles.approveBtn}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(tenant.id)}
                      style={styles.rejectBtn}
                    >
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

        {!isDesktop && (
          <div style={styles.mobileNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  ...styles.mobileNavBtn,
                  backgroundColor:
                    activePage === item.key
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

      <div style={isDesktop ? styles.bodyDesktop : styles.bodyMobile}>
        {isDesktop && (
          <div style={styles.sidebar}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  ...styles.sidebarBtn,
                  backgroundColor:
                    activePage === item.key
                      ? 'rgba(255,255,255,0.15)'
                      : 'transparent',
                  fontWeight: activePage === item.key ? 700 : 400,
                  borderLeft:
                    activePage === item.key
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

        <div style={isDesktop ? styles.mainDesktop : styles.mainMobile}>
          {/* DASHBOARD */}
          {activePage === 'dashboard' && <DashboardContent />}

          {/* UNITS */}
          {activePage === 'units' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Units Management</p>
                {units.map((unit) => (
                  <div key={unit.id} style={styles.unitRow}>
                    <div style={styles.unitBadge}>H{unit.number}</div>
                    <div style={styles.unitInfo}>
                      <p style={styles.unitTenant}>
                        {unit.tenant || 'Available'}
                      </p>
                      {editingUnit === unit.id ? (
                        <div style={styles.editRow}>
                          <div style={styles.editField}>
                            <p style={styles.editLabel}>Rent (Ksh)</p>
                            <input
                              type="number"
                              value={editRent}
                              onChange={(e) => setEditRent(e.target.value)}
                              style={styles.editInput}
                            />
                          </div>
                          {unit.has_water && (
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Water Bill</p>
                              <input
                                type="number"
                                value={editWater}
                                onChange={(e) => setEditWater(e.target.value)}
                                style={styles.editInput}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p style={styles.unitRent}>
                            Ksh {unit.rent.toLocaleString()} ·{' '}
                            {unit.payment_type === 'paybill'
                              ? 'Paybill'
                              : 'Phone'}
                          </p>
                          {unit.has_water && (
                            <p style={styles.unitWater}>
                              💧 Water: Ksh {unit.water_bill.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={styles.unitActions}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusBg(unit.status),
                          color: getStatusColor(unit.status),
                        }}
                      >
                        {unit.status.toUpperCase()}
                      </span>
                      <select
                        value={unit.status}
                        onChange={(e) =>
                          handleStatusChange(unit.id, e.target.value)
                        }
                        style={styles.statusSelect}
                      >
                        <option value="occupied">Occupied</option>
                        <option value="available">Available</option>
                        <option value="vacating">Vacating</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                      {editingUnit === unit.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSaveUnit(unit.id)}
                            style={styles.saveBtn}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUnit(null)}
                            style={styles.cancelBtn}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditUnit(unit)}
                          style={styles.editBtn}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TENANTS */}
          {activePage === 'tenants' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Active Tenants (
                  {tenants.filter((t) => t.status === 'active').length})
                </p>
                {tenants
                  .filter((t) => t.status === 'active')
                  .map((tenant) => (
                    <div key={tenant.id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>H{tenant.house}</div>
                      <div style={styles.tenantInfo}>
                        {editingTenant === tenant.id ? (
                          <div style={styles.editRow}>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Name</p>
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={styles.editInput}
                              />
                            </div>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Phone</p>
                              <input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                style={styles.editInput}
                              />
                            </div>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Penalty Day</p>
                              <select
                                value={editPenaltyDate}
                                onChange={(e) =>
                                  setEditPenaltyDate(e.target.value)
                                }
                                style={styles.editInput}
                              >
                                <option value={5}>5th</option>
                                <option value={10}>10th</option>
                              </select>
                            </div>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Rate %</p>
                              <select
                                value={editPenaltyRate}
                                onChange={(e) =>
                                  setEditPenaltyRate(e.target.value)
                                }
                                style={styles.editInput}
                              >
                                <option value={5.0}>5%</option>
                                <option value={8.0}>8%</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={styles.tenantName}>{tenant.name}</p>
                            <p style={styles.tenantDetails}>
                              @{tenant.username} · {tenant.phone}
                            </p>
                            <p style={styles.tenantPenalty}>
                              Penalty: {tenant.penalty_date}th (
                              {tenant.penalty_rate}%) · Moved in:{' '}
                              {tenant.move_in}
                            </p>
                          </div>
                        )}
                      </div>
                      <div style={styles.tenantActions}>
                        {editingTenant === tenant.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleSaveTenant(tenant.id)}
                              style={styles.saveBtn}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTenant(null)}
                              style={styles.cancelBtn}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleEditTenant(tenant)}
                              style={styles.editBtn}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleVacate(tenant.id)}
                              style={styles.vacateBtn}
                            >
                              Vacate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Vacated Tenants (
                  {tenants.filter((t) => t.status === 'vacated').length})
                </p>
                {tenants.filter((t) => t.status === 'vacated').length === 0 ? (
                  <p style={styles.placeholderText}>No vacated tenants yet.</p>
                ) : (
                  tenants
                    .filter((t) => t.status === 'vacated')
                    .map((tenant) => (
                      <div key={tenant.id} style={styles.tenantRow}>
                        <div
                          style={{
                            ...styles.unitBadge,
                            backgroundColor: '#f4f6f8',
                            color: '#888',
                          }}
                        >
                          H{tenant.house}
                        </div>
                        <div style={styles.tenantInfo}>
                          <p style={{ ...styles.tenantName, color: '#888' }}>
                            {tenant.name}
                          </p>
                          <p style={styles.tenantDetails}>
                            @{tenant.username} · {tenant.phone}
                          </p>
                          <p style={styles.tenantPenalty}>
                            Moved in: {tenant.move_in} · Vacated:{' '}
                            {tenant.move_out}
                          </p>
                        </div>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: '#f4f6f8',
                            color: '#888',
                          }}
                        >
                          VACATED
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activePage === 'payments' && (
            <div>
              {/* Summary Row */}
              <div style={styles.summaryRow}>
                <div style={styles.summaryCard}>
                  <p style={{ ...styles.summaryValue, color: '#1a7a4a' }}>
                    Ksh {totalCollected.toLocaleString()}
                  </p>
                  <p style={styles.summaryLabel}>Total Collected</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={{ ...styles.summaryValue, color: '#c0392b' }}>
                    Ksh {totalOutstanding.toLocaleString()}
                  </p>
                  <p style={styles.summaryLabel}>Outstanding</p>
                </div>
              </div>

              {/* Filter Bar */}
              <div style={styles.card}>
                <div style={styles.filterRow}>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Status</p>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="all">All Payments</option>
                      <option value="paid">Paid Only</option>
                      <option value="unpaid">Unpaid Only</option>
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Month</p>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="all">All Months</option>
                      {availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Results</p>
                    <p style={styles.filterCount}>
                      {filteredPayments.length} payment
                      {filteredPayments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Payment Records</p>

                {filteredPayments.length === 0 ? (
                  <p style={styles.placeholderText}>
                    No payments match your filter.
                  </p>
                ) : (
                  filteredPayments.map((payment) => (
                    <div key={payment.id} style={styles.paymentRowFull}>
                      <div style={styles.unitBadge}>H{payment.house}</div>

                      <div style={styles.paymentInfo}>
                        <p style={styles.paymentTenant}>{payment.tenant}</p>
                        <p style={styles.paymentDate}>
                          {payment.date}
                          {payment.mpesa_code
                            ? ` · Code: ${payment.mpesa_code}`
                            : ' · No payment yet'}
                        </p>
                      </div>

                      <div style={styles.paymentRight}>
                        <p style={styles.paymentAmount}>
                          Ksh {payment.amount.toLocaleString()}
                        </p>
                        <span
                          style={{
                            ...styles.paymentStatusBadge,
                            backgroundColor:
                              payment.status === 'paid' ? '#e8f5ee' : '#fdecea',
                            color:
                              payment.status === 'paid' ? '#1a7a4a' : '#c0392b',
                          }}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* EXPENSES */}
          {activePage === 'expenses' && (
            <div>
              {/* Total Summary */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Total Expenses This Month</p>
                <p
                  style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#c0392b',
                    margin: '0 0 20px',
                  }}
                >
                  Ksh {totalExpenses.toLocaleString()}
                </p>

                {/* Category Breakdown */}
                <div style={styles.categoryRow}>
                  {Object.entries(categoryTotals).map(([category, total]) => {
                    const catStyle = getCategoryStyle(category);
                    return (
                      <div
                        key={category}
                        style={{
                          ...styles.categoryCard,
                          backgroundColor: catStyle.bg,
                        }}
                      >
                        <p
                          style={{
                            ...styles.categoryName,
                            color: catStyle.color,
                          }}
                        >
                          {category}
                        </p>
                        <p
                          style={{
                            ...styles.categoryAmount,
                            color: catStyle.color,
                          }}
                        >
                          Ksh {total.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Expense Form */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Record New Expense</p>

                <div style={styles.expenseFormRow}>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Category</p>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={styles.filterSelect}
                    >
                      <option value="Repairs">Repairs</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ ...styles.filterGroup, flex: 1 }}>
                    <p style={styles.filterLabel}>Description</p>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Roof repair unit 3"
                      style={{
                        ...styles.filterSelect,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Amount (Ksh)</p>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      style={styles.filterSelect}
                      min="1"
                    />
                  </div>

                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>&nbsp;</p>
                    <button
                      onClick={handleAddExpense}
                      style={styles.addExpenseBtn}
                    >
                      + Record
                    </button>
                  </div>
                </div>
              </div>

              {/* Expenses List */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Expense Records ({expenses.length})
                </p>

                {expenses.length === 0 ? (
                  <p style={styles.placeholderText}>
                    No expenses recorded yet.
                  </p>
                ) : (
                  expenses.map((expense) => {
                    const catStyle = getCategoryStyle(expense.category);
                    return (
                      <div key={expense.id} style={styles.expenseRow}>
                        <span
                          style={{
                            ...styles.categoryBadge,
                            backgroundColor: catStyle.bg,
                            color: catStyle.color,
                          }}
                        >
                          {expense.category}
                        </span>

                        <div style={styles.expenseInfo}>
                          <p style={styles.expenseDescription}>
                            {expense.description}
                          </p>
                          <p style={styles.expenseDate}>{expense.date}</p>
                        </div>

                        <p style={styles.expenseAmount}>
                          Ksh {expense.amount.toLocaleString()}
                        </p>

                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          {/* MESSAGES */}
          {activePage === 'messages' && (
            <div>
              {/* Send Message Form */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Send SMS Message</p>

                {/* Recipient */}
                <div style={styles.filterGroup}>
                  <p style={styles.filterLabel}>Send To</p>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">
                      All Tenants (
                      {tenants.filter((t) => t.status === 'active').length})
                    </option>
                    {tenants
                      .filter((t) => t.status === 'active')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} - House {t.house}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Quick Templates */}
                <div style={{ marginTop: '20px', marginBottom: '8px' }}>
                  <p style={styles.filterLabel}>Quick Templates</p>
                </div>
                <div style={styles.templatesRow}>
                  {[
                    { key: 'reminder', label: '📅 Rent Reminder' },
                    { key: 'confirmed', label: '✅ Payment Confirmed' },
                    { key: 'balance', label: '⚠️ Balance Alert' },
                    { key: 'custom', label: '✏️ Custom Message' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleTemplateSelect(t.key)}
                      style={{
                        ...styles.templateBtn,
                        backgroundColor:
                          messageTemplate === t.key ? '#1a7a4a' : '#f4f6f8',
                        color: messageTemplate === t.key ? 'white' : '#555',
                        border:
                          messageTemplate === t.key ? 'none' : '1px solid #ddd',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Message Text */}
                <div style={{ marginTop: '20px' }}>
                  <p style={styles.filterLabel}>Message</p>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    style={styles.messageTextarea}
                  />
                  <p
                    style={{
                      fontSize: '12px',
                      margin: '4px 0 0',
                      textAlign: 'right',
                      color: messageText.length > 160 ? '#c0392b' : '#888',
                      fontWeight: messageText.length > 160 ? 700 : 400,
                    }}
                  >
                    {messageText.length}/160
                    {messageText.length > 160 && ' — Over SMS limit!'}
                  </p>
                </div>

                {/* Send Button */}
                <button onClick={handleSendMessage} style={styles.sendBtn}>
                  Send SMS
                </button>
              </div>

              {/* Message History */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Message History ({messageHistory.length})
                </p>

                {messageHistory.length === 0 ? (
                  <p style={styles.placeholderText}>No messages sent yet.</p>
                ) : (
                  messageHistory.map((msg) => (
                    <div key={msg.id} style={styles.messageRow}>
                      <div style={styles.messageInfo}>
                        <div style={styles.messageTopRow}>
                          <p style={styles.messageRecipient}>{msg.recipient}</p>
                          <p style={styles.messageDate}>{msg.date}</p>
                        </div>
                        <p style={styles.messageContent}>{msg.content}</p>
                      </div>
                      <span style={styles.messageSentBadge}>SENT ✅</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* WATER BILLS */}
          {activePage === 'water' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Set water bills -July 2026</p>
                <p style={{ fontSize:'12px', color:'#945', margin: '0,0,20px'}}>
                  Set the water Bill for House 7 and House 8 before tenants pay this month
                </p>

                <div style={styles.waterCardsRow}>

                  {(() =>{
                    const unit7 = units.find( u => u.number ===7);
                    const tenant7 = tenants.find(t => t.house === 7 && t.status === 'active');

                    return(
                      <div style ={styles.waterCard}>
                        <div style ={styles.waterCardHeader}>
                          <div style ={styles.unitBadge}>H7</div>
                          <div>
                            <p style = {styles.waterTenantName}>{tenant7?.name || 'no tenant'}</p>
                            <p style ={styles.waterCurrentBill}>
                              Current: Ksh {(unit7?.water_bill || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div style={styles.waterInputRow}>
                          <input
                            type='number'
                            value={newWater7}
                            onChange={(e) => setNewWater7(e.target.value)}
                            placeholder='newAmount'
                            style={styles.waterInput}
                            min='2'
                          />
                          <button
                            onClick={() => handleSaveWaterBill(7, newWater7)}
                            style={styles.waterSaveBtn}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );

                  })()}
                  {(() =>{
                    const unit8 = units.find( u => u.number ===8);
                    const tenant8 = tenants.find(t => t.house === 8 && t.status === 'active');

                    return(
                      <div style ={styles.waterCard}>
                        <div style ={styles.waterCardHeader}>
                          <div style ={styles.unitBadge}>H8</div>
                          <div>
                            <p style = {styles.waterTenantName}>{tenant8?.name || 'no tenant'}</p>
                            <p style ={styles.waterCurrentBill}>
                              Current: Ksh {(unit8?.water_bill || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div style={styles.waterInputRow}>
                          <input
                            type='number'
                            value={newWater8}
                            onChange={(e) => setNewWater8(e.target.value)}
                            placeholder='newAmount'
                            style={styles.waterInput}
                            min='2'
                          />
                          <button
                            onClick={() => handleSaveWaterBill(8, newWater8)}
                            style={styles.waterSaveBtn}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );

                  })()}

                  <button
                    onClick={handleSaveMonthlyBills}
                    style={styles.saveMonthBtn}
                  >
                    Save Monthly Bills
                  </button>

                  <div style={styles.card}>
                    <p style={styles.cardTitle}>
                       Water Bill History
                    </p>
                    <div style={styles.waterTableHeader}>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700 }}>Month</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>House 7</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>House 8</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>Total</p>
                    </div>

                    {waterHistory.map ((record) =>(
                      <div key={record.id} style={styles.waterTableRow}>
                        <p style={styles.waterTableCell}>{record.month}</p>
                        <p style={{...styles.waterTableCell, textAlign:'right', color:'#5635'}}>
                          Ksh {record.house7.toLocaleString()}
                        </p>
                        <p style={{...styles.waterTableCell, textAlign:'right', color:'#5635'}}>
                          Ksh {record.house8.toLocaleString()}
                        </p>
                        <p style={{...styles.waterTableCell, textAlign:'right', color:'#5635'}}>
                          Ksh {(record.house7 + record.house8).toLocaleString()}
                        </p>
                      </div>
                    ))}

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR CODES */}
          {activePage === 'qrcodes' && (
            <div style={styles.card}>
              <p style={styles.cardTitle}>QR Codes</p>
              <p style={styles.placeholderText}>Coming in Day 16!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GREEN = '#1a7a4a';
const DARK_GREEN = '#145f38';

const styles = {
  // ---- PAGE LAYOUT ----
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

  // ---- HEADER ----
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
  headerName: {
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 4px',
  },
  headerSub: {
    fontSize: '14px',
    opacity: 0.8,
    margin: 0,
  },
  logoutBtn: {
    padding: '10px 22px',
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },

  // ---- MOBILE NAV ----
  mobileNav: {
    display: 'flex',
    overflowX: 'auto',
    gap: '6px',
    paddingTop: '8px',
  },
  mobileNavBtn: {
    padding: '10px 16px',
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
    padding: '2px 8px',
    fontSize: '11px',
    marginLeft: '6px',
  },

  // ---- BODY ----
  bodyDesktop: {
    display: 'flex',
    flex: 1,
  },
  bodyMobile: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },

  // ---- SIDEBAR ----
  sidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: DARK_GREEN,
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  sidebarBtn: {
    width: '100%',
    padding: '14px 24px',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'background 0.2s',
  },

  // ---- MAIN CONTENT ----
  mainDesktop: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
  },
  mainMobile: {
    flex: 1,
    padding: '20px',
  },
  contentRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },

  // ---- SUMMARY CARDS ----
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px',
  },
  summaryCard: {
    flex: '1 1 140px',
    background: 'white',
    borderRadius: '16px',
    padding: '24px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  summaryValue: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 6px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  // ---- CARDS ----
  card: {
    background: 'white',
    borderRadius: '16px',
    marginBottom: '24px',
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

  // ---- QUICK ACTIONS ----
  actionsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '12px 20px',
    backgroundColor: '#e8f5ee',
    color: GREEN,
    border: '1px solid #b8dfc9',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // ---- PAYMENT ROWS ----
  paymentRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  paymentTenant: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
  },
  paymentDate: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  paymentAmount: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  paymentStatus: {
    fontSize: '12px',
    fontWeight: 700,
    margin: 0,
    textAlign: 'right',
  },

  // ---- PENDING ROWS ----
  pendingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '12px',
  },
  pendingName: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
  },
  pendingDetails: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 2px',
  },
  approveBtn: {
    padding: '10px 18px',
    backgroundColor: GREEN,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '10px 18px',
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // ---- UNIT ROWS ----
  unitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  unitBadge: {
    width: '44px',
    height: '44px',
    minWidth: '44px',
    borderRadius: '12px',
    backgroundColor: '#e8f5ee',
    color: GREEN,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
  },
  unitInfo: {
    flex: 1,
    minWidth: '150px',
  },
  unitTenant: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
  },
  unitRent: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  unitWater: {
    fontSize: '13px',
    color: '#2980b9',
    margin: '4px 0 0',
  },
  unitActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },

  // ---- EDIT FIELDS ----
  editRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  editLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
    fontWeight: 500,
  },
  editInput: {
    width: '120px',
    padding: '8px 12px',
    border: '1.5px solid #1a7a4a',
    borderRadius: '8px',
    fontSize: '14px',
  },
  editBtn: {
    padding: '8px 18px',
    backgroundColor: '#e8f5ee',
    color: GREEN,
    border: '1px solid #b8dfc9',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 18px',
    backgroundColor: GREEN,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 18px',
    backgroundColor: '#f4f6f8',
    color: '#555',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },

  // ---- TENANT ROWS ----
  tenantRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  tenantInfo: {
    flex: 1,
    minWidth: '200px',
  },
  tenantName: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
  },
  tenantDetails: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 4px',
  },
  tenantPenalty: {
    fontSize: '12px',
    color: '#f57c00',
    margin: 0,
  },
  tenantActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '4px',
  },
  vacateBtn: {
    padding: '8px 18px',
    backgroundColor: '#fdecea',
    color: '#c0392b',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // ---- MISC ----
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  placeholderText: {
    color: '#888',
    fontSize: '15px',
    textAlign: 'center',
    padding: '48px 0',
  },
  filterRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    minWidth: '160px',
  },
  filterCount: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a7a4a',
    margin: 0,
    padding: '10px 0',
  },
  paymentRowFull: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  paymentInfo: {
    flex: 1,
    minWidth: '150px',
  },
  paymentStatusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  categoryRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  categoryCard: {
    flex: '1 1 120px',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  categoryName: {
    fontSize: '12px',
    fontWeight: 700,
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  categoryAmount: {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
  },
  expenseFormRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  addExpenseBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  expenseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  expenseInfo: {
    flex: 1,
    minWidth: '150px',
  },
  expenseDescription: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: '#1a1a1a',
  },
  expenseDate: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  expenseAmount: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#c0392b',
    margin: 0,
  },
  deleteBtn: {
    padding: '6px 14px',
    backgroundColor: '#fdecea',
    color: '#c0392b',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  templatesRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  templateBtn: {
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  messageTextarea: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    lineHeight: 1.5,
  },
  sendBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '16px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  messageInfo: {
    flex: 1,
  },
  messageTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  messageRecipient: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: 0,
  },
  messageDate: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
  messageContent: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
    lineHeight: 1.5,
  },
  messageSentBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#1a7a4a',
    whiteSpace: 'nowrap',
  },
  waterCardsRow: {
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  marginBottom: '24px',
},
waterCard: {
  flex: 1,
  minWidth: '200px',
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  padding: '20px',
  border: '1px solid #e8f4fd',
},
waterCardHeader: {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
},
waterTenantName: {
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 4px',
  color: '#1a1a1a',
},
waterCurrentBill: {
  fontSize: '13px',
  color: '#2980b9',
  margin: 0,
  fontWeight: 500,
},
waterInputRow: {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
},
waterInput: {
  flex: 1,
  padding: '10px 14px',
  border: '1.5px solid #ddd',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
},
waterSaveBtn: {
  padding: '10px 18px',
  backgroundColor: '#1a7a4a',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
},
saveMonthBtn: {
  width: '100%',
  padding: '14px',
  backgroundColor: '#2980b9',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
},
waterTableHeader: {
  display: 'flex',
  padding: '10px 0',
  borderBottom: '2px solid #f0f0f0',
  marginBottom: '4px',
},
waterTableRow: {
  display: 'flex',
  padding: '12px 0',
  borderBottom: '1px solid #f0f0f0',
  alignItems: 'center',
},
waterTableCell: {
  flex: 1,
  fontSize: '14px',
  color: '#555',
  margin: 0,
},
};

export default AdminDashboard;
