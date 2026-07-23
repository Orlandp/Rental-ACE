import React, { useState, useEffect } from 'react';

const mockAdmin = { name: 'James Orlando', property: 'Ace Apartments', location: 'Eldoret' };

const messageTemplates = {
  reminder: 'Dear tenant, your rent is due on the 1st. Please pay via the QR code on your door.',
  confirmed: 'Your payment has been received. Thank you.',
  balance: 'You have an outstanding balance. Please clear it at your earliest convenience.',
  custom: '',
};

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
  const [properties, setProperties] = useState([]);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyLocation, setNewPropertyLocation] = useState('');
  const [newPropertyPaybill, setNewPropertyPaybill] = useState('');
  const [newPropertyAccount, setNewPropertyAccount] = useState('');
  const [newUnitPropertyId, setNewUnitPropertyId] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitRent, setNewUnitRent] = useState('');
  const [newUnitPaymentType, setNewUnitPaymentType] = useState('paybill');
  const [newUnitPhone, setNewUnitPhone] = useState('');
  const [newUnitHasWater, setNewUnitHasWater] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadPending() {
    try {
      const res = await fetch('http://localhost:5000/api/tenants/pending', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setPending(data);
    } catch (err) {
      console.error('Could not load pending tenants:', err);
    }
  }

  async function loadUnits() {
    try {
      const res = await fetch('http://localhost:5000/api/units', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setUnits(data);
    } catch (err) {
      console.error('Could not load units:', err);
    }
  }

  async function loadProperties() {
    try {
      const res = await fetch('http://localhost:5000/api/properties', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setProperties(data);
    } catch (err) {
      console.error('Could not load properties:', err);
    }
  }

  async function handleAddProperty() {
    if (!newPropertyName.trim() || !newPropertyLocation.trim() || !newPropertyAccount.trim()) {
      alert('Name, location, and account number are required.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newPropertyName,
          location: newPropertyLocation,
          paybill_no: newPropertyPaybill || null,
          account_no: newPropertyAccount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not add property.');
        return;
      }
      await loadProperties();
      setNewPropertyName('');
      setNewPropertyLocation('');
      setNewPropertyPaybill('');
      setNewPropertyAccount('');
      alert('Property added!');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDeleteProperty(propertyId) {
    const confirmed = window.confirm(
      'Delete this property? This only works if it has no units left.',
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/properties/${propertyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not delete property.');
        return;
      }
      await loadProperties();
      alert('Property deleted.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleAddUnit() {
    if (!newUnitPropertyId || !newUnitNumber || !newUnitRent) {
      alert('Property, unit number, and rent are required.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/properties/${newUnitPropertyId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          unit_number: parseInt(newUnitNumber),
          rent_amount: parseInt(newUnitRent),
          payment_type: newUnitPaymentType,
          phone_no: newUnitPaymentType === 'phone' ? newUnitPhone : null,
          has_water_bill: newUnitHasWater ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not add unit.');
        return;
      }
      await loadUnits();
      setNewUnitPropertyId('');
      setNewUnitNumber('');
      setNewUnitRent('');
      setNewUnitPaymentType('paybill');
      setNewUnitPhone('');
      setNewUnitHasWater(false);
      alert('Unit added!');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDeleteUnit(unitId) {
    const confirmed = window.confirm(
      'Delete this unit? This only works if it has no active tenant.',
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/units/${unitId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not delete unit.');
        return;
      }
      await loadUnits();
      alert('Unit deleted.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function loadTenants() {
    try {
      const res = await fetch('http://localhost:5000/api/tenants', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setTenants(data);
    } catch (err) {
      console.error('Could not load tenants:', err);
    }
  }

  async function loadPayments() {
    try {
      const res = await fetch('http://localhost:5000/api/payments', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setAllPayments(data);
        setPayments(data.slice(0, 3));
      }
    } catch (err) {
      console.error('Could not load payments:', err);
    }
  }

  async function loadExpenses() {
    try {
      const res = await fetch ('http://localhost:5000/api/expenses', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {
      console.error('could not load expenses:',err);
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch ('http://localhost:5000/api/messages', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setMessageHistory(data);    
    } catch (err) {
      console.error('could not load messages:',err);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setAdmin(mockAdmin);
        await loadExpenses();
        await loadMessages();
        await loadUnits();
        await loadProperties();
        await loadTenants();
        await loadPending();
        await loadPayments();
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => (u.status || '').toUpperCase() === 'OCCUPIED').length;
  const availableUnits = units.filter((u) => (u.status || '').toUpperCase() === 'AVAILABLE').length;
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

  async function handleApprove(userId, unitId) {
    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unit_id: unitId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not approve tenant.');
        return;
      }
      await loadPending();
      await loadTenants();
      await loadUnits();
      alert('Tenant approved!');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleReject(userId) {
    const confirmed = window.confirm('Reject and remove this applicant?');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${userId}/reject`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not reject tenant.');
        return;
      }
      await loadPending();
      alert('Applicant rejected.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function getPaymentColor(status) {
    if (status === 'paid') return '#1a7a4a';
    if (status === 'unpaid') return '#c0392b';
    return '#888';
  }

  function getStatusColor(status) {
    const s = (status || '').toUpperCase();
    if (s === 'OCCUPIED') return '#1a7a4a';
    if (s === 'AVAILABLE') return '#2980b9';
    if (s === 'VACATING') return '#f57c00';
    if (s === 'MAINTENANCE') return '#c0392b';
    return '#888';
  }

  function getStatusBg(status) {
    const s = (status || '').toUpperCase();
    if (s === 'OCCUPIED') return '#e8f5ee';
    if (s === 'AVAILABLE') return '#e8f4fd';
    if (s === 'VACATING') return '#fff8e1';
    if (s === 'MAINTENANCE') return '#fdecea';
    return '#f4f6f8';
  }

  function handleEditUnit(unit) {
    setEditingUnit(unit.unit_id);
    setEditRent(unit.rent_amount);
    setEditWater(unit.water_bill || 0);
  }

  async function handleSaveUnit(unitId) {
    try {
      const res = await fetch(`http://localhost:5000/api/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rent_amount: parseInt(editRent),
          water_bill: parseInt(editWater),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not update unit.');
        return;
      }
      await loadUnits();
      setEditingUnit(null);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleStatusChange(unitId, newStatus) {
    try {
      const res = await fetch(`http://localhost:5000/api/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not update status.');
        return;
      }
      await loadUnits();
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function handleEditTenant(tenant) {
    setEditingTenant(tenant.user_id);
    setEditName(tenant.full_name);
    setEditPhone(tenant.phone);
  }

  function handleSaveTenant(tenantId) {
    setEditingTenant(null);
  }

  async function handleVacate(tenantId) {
    const confirmed = window.confirm(
      'Are you sure you want to mark this tenant as vacated?',
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tenants/${tenantId}/vacate`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not vacate tenant.');
        return;
      }
      await loadTenants();
      await loadUnits();
      alert('Tenant vacated.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function getCategoryStyle(category) {
    if (category === 'Repairs') return { bg: '#fdecea', color: '#c0392b' };
    if (category === 'Cleaning') return { bg: '#e8f4fd', color: '#2980b9' };
    if (category === 'Utilities') return { bg: '#fff8e1', color: '#f57c00' };
    if (category === 'Security') return { bg: '#f3e5f5', color: '#8e24aa' };
    return { bg: '#f4f6f8', color: '#555' };
  }

  async function handleAddExpense() {
    if (!newDescription.trim()) {
      alert('Please enter a description.');
      return;
    }
    if (!newAmount || parseInt(newAmount) < 1) {
      alert('Please enter a valid amount.');
      return;
    }
    const propertyId = properties[0]?.property_id;
    if (!propertyId) {
      alert('No property found to attach this expense to.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          property_id: propertyId,
          category: newCategory,
          description: newDescription,
          amount: parseInt(newAmount),
          expense_date: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not record expense.');
        return;
      }
      await loadExpenses();
      setNewDescription('');
      setNewAmount('');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = window.confirm('Delete this expense?');
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not delete expense.');
        return;
      }
      await loadExpenses();
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = {
    Repairs: expenses.filter((e) => e.category === 'Repairs').reduce((sum, e) => sum + e.amount, 0),
    Cleaning: expenses.filter((e) => e.category === 'Cleaning').reduce((sum, e) => sum + e.amount, 0),
    Utilities: expenses.filter((e) => e.category === 'Utilities').reduce((sum, e) => sum + e.amount, 0),
    Security: expenses.filter((e) => e.category === 'Security').reduce((sum, e) => sum + e.amount, 0),
    Other: expenses.filter((e) => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0),
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

  async function sendOneMessage(phone) {
    const res = await fetch('http://localhost:5000/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ recipient: phone, content: messageText }),
    });
    return res.ok;
  }

  async function handleSendMessage() {
    if (!messageText.trim()) {
      alert('Please enter a message.');
      return;
    }

    const activeTenants = tenants.filter((t) => t.status === 'active');
    const targets =
      recipient === 'all'
        ? activeTenants.map((t) => t.phone)
        : (() => {
            const t = tenants.find((t) => t.user_id === parseInt(recipient));
            return t ? [t.phone] : [];
          })();

    if (targets.length === 0) {
      alert('No valid recipient found.');
      return;
    }

    try {
      for (const phone of targets) {
        await sendOneMessage(phone);
      }
      await loadMessages();
      setMessageText('');
      alert(`Message sent to ${targets.length} recipient(s)!`);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function handleSaveWaterBill(houseNumber, amount) {
    if (!amount || parseInt(amount) < 1) {
      alert('please enter a valid amount');
      return;
    }
    setUnits(units.map(u =>
      u.unit_number === houseNumber
        ? { ...u, water_bill: parseInt(amount) }
        : u
    ));
    if (houseNumber === 7) setNewWater7('');
    if (houseNumber === 8) setNewWater8('');
    alert(`House ${houseNumber} water bill updated to Ksh ${parseInt(amount).toLocaleString()}!`);
  }

  function handleSaveMonthlyBills() {
    const house7Bill = units.find(u => u.unit_number === 7)?.water_bill || 0;
    const house8Bill = units.find(u => u.unit_number === 8)?.water_bill || 0;

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
            <button onClick={() => setActivePage('expenses')} style={styles.actionBtn}>+ Expense</button>
            <button onClick={() => setActivePage('messages')} style={styles.actionBtn}>💬 Message</button>
            <button onClick={() => setActivePage('water')} style={styles.actionBtn}>💧 Water Bills</button>
            <button
              onClick={() => setActivePage('dashboard')}
              style={{ ...styles.actionBtn, backgroundColor: '#fff8e1', color: '#f57c00', border: '1px solid #ffe082' }}
            >
              ✅ Approvals {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        <div style={isDesktop ? styles.contentRow : {}}>
          <div style={{ ...styles.card, flex: 1 }}>
            <p style={styles.cardTitle}>Recent Payments</p>
            {payments.map((payment) => (
              <div key={payment.payment_id} style={styles.paymentRow}>
                <div>
                  <p style={styles.paymentTenant}>{payment.tenant_name}</p>
                  <p style={styles.paymentDate}>
                    House {payment.unit_number} · {payment.payment_date}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={styles.paymentAmount}>Ksh {payment.amount.toLocaleString()}</p>
                  <p style={{ ...styles.paymentStatus, color: getPaymentColor(payment.status) }}>
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
                <div key={tenant.user_id} style={styles.pendingRow}>
                  <div>
                    <p style={styles.pendingName}>{tenant.full_name}</p>
                    <p style={styles.pendingDetails}>
                      Requested House {tenant.unit_id || '—'} · {tenant.phone}
                    </p>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{tenant.created_at}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApprove(tenant.user_id, tenant.unit_id)} style={styles.approveBtn}>Approve</button>
                    <button onClick={() => handleReject(tenant.user_id)} style={styles.rejectBtn}>Reject</button>
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
            <p style={styles.headerSub}>{admin.property} · {admin.location}</p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>

        {!isDesktop && (
          <div style={styles.mobileNav}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  ...styles.mobileNavBtn,
                  backgroundColor: activePage === item.key ? 'rgba(255,255,255,0.3)' : 'transparent',
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
                  backgroundColor: activePage === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  fontWeight: activePage === item.key ? 700 : 400,
                  borderLeft: activePage === item.key ? '4px solid white' : '4px solid transparent',
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
          {activePage === 'dashboard' && <DashboardContent />}

          {/* UNITS */}
          {activePage === 'units' && (
            <div>
              {/* Manage Properties */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Manage Properties</p>

                {properties.map((p) => (
                  <div key={p.property_id} style={styles.unitRow}>
                    <div style={styles.unitInfo}>
                      <p style={styles.unitTenant}>{p.name}</p>
                      <p style={styles.unitRent}>
                        {p.location} · Paybill {p.paybill_no || '—'} · Acc {p.account_no}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteProperty(p.property_id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                ))}

                <div style={styles.editRow}>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Name</p>
                    <input
                      value={newPropertyName}
                      onChange={(e) => setNewPropertyName(e.target.value)}
                      placeholder="e.g. Sunrise Apartments"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Location</p>
                    <input
                      value={newPropertyLocation}
                      onChange={(e) => setNewPropertyLocation(e.target.value)}
                      placeholder="e.g. Nakuru"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Paybill (optional)</p>
                    <input
                      value={newPropertyPaybill}
                      onChange={(e) => setNewPropertyPaybill(e.target.value)}
                      placeholder="e.g. 4567"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Account No</p>
                    <input
                      value={newPropertyAccount}
                      onChange={(e) => setNewPropertyAccount(e.target.value)}
                      placeholder="e.g. 9876543210"
                      style={styles.editInput}
                    />
                  </div>
                  <button onClick={handleAddProperty} style={styles.saveBtn}>+ Add Property</button>
                </div>
              </div>

              {/* Add Unit */}
              <div style={styles.card}>
                <p style={styles.cardTitle}>Add Unit</p>
                <div style={styles.editRow}>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Property</p>
                    <select
                      value={newUnitPropertyId}
                      onChange={(e) => setNewUnitPropertyId(e.target.value)}
                      style={styles.statusSelect}
                    >
                      <option value="">-- Select --</option>
                      {properties.map((p) => (
                        <option key={p.property_id} value={p.property_id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Unit Number</p>
                    <input
                      type="number"
                      value={newUnitNumber}
                      onChange={(e) => setNewUnitNumber(e.target.value)}
                      placeholder="e.g. 11"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Rent (Ksh)</p>
                    <input
                      type="number"
                      value={newUnitRent}
                      onChange={(e) => setNewUnitRent(e.target.value)}
                      placeholder="e.g. 20000"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Payment Type</p>
                    <select
                      value={newUnitPaymentType}
                      onChange={(e) => setNewUnitPaymentType(e.target.value)}
                      style={styles.statusSelect}
                    >
                      <option value="paybill">Paybill</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>
                  {newUnitPaymentType === 'phone' && (
                    <div style={styles.editField}>
                      <p style={styles.editLabel}>Phone Number</p>
                      <input
                        value={newUnitPhone}
                        onChange={(e) => setNewUnitPhone(e.target.value)}
                        placeholder="e.g. 0722223432"
                        style={styles.editInput}
                      />
                    </div>
                  )}
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Has Water Bill?</p>
                    <select
                      value={newUnitHasWater ? 'yes' : 'no'}
                      onChange={(e) => setNewUnitHasWater(e.target.value === 'yes')}
                      style={styles.statusSelect}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <button onClick={handleAddUnit} style={styles.saveBtn}>+ Add Unit</button>
                </div>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Units Management</p>
                {units.map((unit) => {
                  const occupant = tenants.find((t) => t.unit_id === unit.unit_id && t.status === 'active');
                  return (
                    <div key={unit.unit_id} style={styles.unitRow}>
                      <div style={styles.unitBadge}>H{unit.unit_number}</div>
                      <div style={styles.unitInfo}>
                        <p style={styles.unitTenant}>{occupant ? occupant.full_name : 'Available'}</p>
                        {editingUnit === unit.unit_id ? (
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
                            {unit.has_water_bill ? (
                              <div style={styles.editField}>
                                <p style={styles.editLabel}>Water Bill</p>
                                <input
                                  type="number"
                                  value={editWater}
                                  onChange={(e) => setEditWater(e.target.value)}
                                  style={styles.editInput}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <p style={styles.unitRent}>
                              Ksh {unit.rent_amount.toLocaleString()} ·{' '}
                              {unit.payment_type === 'paybill' ? 'Paybill' : 'Phone'}
                            </p>
                            {unit.has_water_bill ? (
                              <p style={styles.unitWater}>💧 Water: Ksh {unit.water_bill.toLocaleString()}</p>
                            ) : null}
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
                          {(unit.status || '').toUpperCase()}
                        </span>
                        <select
                          value={unit.status}
                          onChange={(e) => handleStatusChange(unit.unit_id, e.target.value)}
                          style={styles.statusSelect}
                        >
                          <option value="OCCUPIED">Occupied</option>
                          <option value="AVAILABLE">Available</option>
                          <option value="VACATING">Vacating</option>
                          <option value="MAINTENANCE">Maintenance</option>
                        </select>
                        {editingUnit === unit.unit_id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleSaveUnit(unit.unit_id)} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setEditingUnit(null)} style={styles.cancelBtn}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditUnit(unit)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => handleDeleteUnit(unit.unit_id)} style={styles.deleteBtn}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TENANTS */}
          {activePage === 'tenants' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Active Tenants ({tenants.filter((t) => t.status === 'active').length})
                </p>
                {tenants
                  .filter((t) => t.status === 'active')
                  .map((tenant) => (
                    <div key={tenant.user_id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>H{tenant.unit_id}</div>
                      <div style={styles.tenantInfo}>
                        {editingTenant === tenant.user_id ? (
                          <div style={styles.editRow}>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Name</p>
                              <input value={editName} onChange={(e) => setEditName(e.target.value)} style={styles.editInput} />
                            </div>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Phone</p>
                              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={styles.editInput} />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={styles.tenantName}>{tenant.full_name}</p>
                            <p style={styles.tenantDetails}>@{tenant.username} · {tenant.phone}</p>
                            <p style={styles.tenantPenalty}>Joined: {tenant.created_at}</p>
                          </div>
                        )}
                      </div>
                      <div style={styles.tenantActions}>
                        {editingTenant === tenant.user_id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleSaveTenant(tenant.user_id)} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setEditingTenant(null)} style={styles.cancelBtn}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleEditTenant(tenant)} style={styles.editBtn}>Edit</button>
                            <button onClick={() => handleVacate(tenant.user_id)} style={styles.vacateBtn}>Vacate</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>
                  Vacated Tenants ({tenants.filter((t) => t.status === 'vacated').length})
                </p>
                {tenants.filter((t) => t.status === 'vacated').length === 0 ? (
                  <p style={styles.placeholderText}>No vacated tenants yet.</p>
                ) : (
                  tenants.filter((t) => t.status === 'vacated').map((tenant) => (
                    <div key={tenant.user_id} style={styles.tenantRow}>
                      <div style={{ ...styles.unitBadge, backgroundColor: '#f4f6f8', color: '#888' }}>—</div>
                      <div style={styles.tenantInfo}>
                        <p style={{ ...styles.tenantName, color: '#888' }}>{tenant.full_name}</p>
                        <p style={styles.tenantDetails}>@{tenant.username} · {tenant.phone}</p>
                      </div>
                      <span style={{ ...styles.statusBadge, backgroundColor: '#f4f6f8', color: '#888' }}>VACATED</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activePage === 'payments' && (
            <div>
              <div style={styles.summaryRow}>
                <div style={styles.summaryCard}>
                  <p style={{ ...styles.summaryValue, color: '#1a7a4a' }}>Ksh {totalCollected.toLocaleString()}</p>
                  <p style={styles.summaryLabel}>Total Collected</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={{ ...styles.summaryValue, color: '#c0392b' }}>Ksh {totalOutstanding.toLocaleString()}</p>
                  <p style={styles.summaryLabel}>Outstanding</p>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.filterRow}>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Status</p>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
                      <option value="all">All Payments</option>
                      <option value="paid">Paid Only</option>
                      <option value="unpaid">Unpaid Only</option>
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Month</p>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={styles.filterSelect}>
                      <option value="all">All Months</option>
                      {availableMonths.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Results</p>
                    <p style={styles.filterCount}>{filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Payment Records</p>
                {filteredPayments.length === 0 ? (
                  <p style={styles.placeholderText}>No payments match your filter.</p>
                ) : (
                  filteredPayments.map((payment) => (
                    <div key={payment.payment_id} style={styles.paymentRowFull}>
                      <div style={styles.unitBadge}>H{payment.unit_number}</div>
                      <div style={styles.paymentInfo}>
                        <p style={styles.paymentTenant}>{payment.tenant_name}</p>
                        <p style={styles.paymentDate}>
                          {payment.payment_date}{payment.mpesa_code ? ` · Code: ${payment.mpesa_code}` : ' · No payment yet'}
                        </p>
                      </div>
                      <div style={styles.paymentRight}>
                        <p style={styles.paymentAmount}>Ksh {payment.amount.toLocaleString()}</p>
                        <span
                          style={{
                            ...styles.paymentStatusBadge,
                            backgroundColor: payment.status === 'paid' ? '#e8f5ee' : '#fdecea',
                            color: payment.status === 'paid' ? '#1a7a4a' : '#c0392b',
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
              <div style={styles.card}>
                <p style={styles.cardTitle}>Total Expenses This Month</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: '#c0392b', margin: '0 0 20px' }}>
                  Ksh {totalExpenses.toLocaleString()}
                </p>
                <div style={styles.categoryRow}>
                  {Object.entries(categoryTotals).map(([category, total]) => {
                    const catStyle = getCategoryStyle(category);
                    return (
                      <div key={category} style={{ ...styles.categoryCard, backgroundColor: catStyle.bg }}>
                        <p style={{ ...styles.categoryName, color: catStyle.color }}>{category}</p>
                        <p style={{ ...styles.categoryAmount, color: catStyle.color }}>Ksh {total.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Record New Expense</p>
                <div style={styles.expenseFormRow}>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Category</p>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={styles.filterSelect}>
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
                      style={{ ...styles.filterSelect, width: '100%', boxSizing: 'border-box' }}
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
                    <button onClick={handleAddExpense} style={styles.addExpenseBtn}>+ Record</button>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Expense Records ({expenses.length})</p>
                {expenses.length === 0 ? (
                  <p style={styles.placeholderText}>No expenses recorded yet.</p>
                ) : (
                  expenses.map((expense) => {
                    const catStyle = getCategoryStyle(expense.category);
                    return (
                      <div key={expense.expense_id} style={styles.expenseRow}>
                        <span style={{ ...styles.categoryBadge, backgroundColor: catStyle.bg, color: catStyle.color }}>
                          {expense.category}
                        </span>
                        <div style={styles.expenseInfo}>
                          <p style={styles.expenseDescription}>{expense.description}</p>
                          <p style={styles.expenseDate}>{expense.expense_date}</p>
                        </div>
                        <p style={styles.expenseAmount}>Ksh {expense.amount.toLocaleString()}</p>
                        <button onClick={() => handleDeleteExpense(expense.expense_id)} style={styles.deleteBtn}>Delete</button>
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
              <div style={styles.card}>
                <p style={styles.cardTitle}>Send SMS Message</p>
                <div style={styles.filterGroup}>
                  <p style={styles.filterLabel}>Send To</p>
                  <select value={recipient} onChange={(e) => setRecipient(e.target.value)} style={styles.filterSelect}>
                    <option value="all">All Tenants ({tenants.filter((t) => t.status === 'active').length})</option>
                    {tenants.filter((t) => t.status === 'active').map((t) => (
                      <option key={t.user_id} value={t.user_id}>{t.full_name} - House {t.unit_id}</option>
                    ))}
                  </select>
                </div>

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
                        backgroundColor: messageTemplate === t.key ? '#1a7a4a' : '#f4f6f8',
                        color: messageTemplate === t.key ? 'white' : '#555',
                        border: messageTemplate === t.key ? 'none' : '1px solid #ddd',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <p style={styles.filterLabel}>Message</p>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    style={styles.messageTextarea}
                  />
                  <p style={{
                    fontSize: '12px', margin: '4px 0 0', textAlign: 'right',
                    color: messageText.length > 160 ? '#c0392b' : '#888',
                    fontWeight: messageText.length > 160 ? 700 : 400,
                  }}>
                    {messageText.length}/160{messageText.length > 160 && ' — Over SMS limit!'}
                  </p>
                </div>

                <button onClick={handleSendMessage} style={styles.sendBtn}>Send SMS</button>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Message History ({messageHistory.length})</p>
               {messageHistory.length === 0 ? (
                  <p style={styles.placeholderText}>No messages sent yet.</p>
                ) : (
                  messageHistory.map((msg) => (
                    <div key={msg.message_id} style={styles.messageRow}>
                      <div style={styles.messageInfo}>
                        <div style={styles.messageTopRow}>
                          <p style={styles.messageRecipient}>{msg.recipient}</p>
                          <p style={styles.messageDate}>{msg.sent_at}</p>
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
                <p style={{ fontSize: '12px', color: '#945', margin: '0 0 20px' }}>
                  Set the water Bill for House 7 and House 8 before tenants pay this month
                </p>

                <div style={styles.waterCardsRow}>
                  {(() => {
                    const unit7 = units.find(u => u.unit_number === 7);
                    const tenant7 = tenants.find(t => t.unit_id === 7 && t.status === 'active');
                    return (
                      <div style={styles.waterCard}>
                        <div style={styles.waterCardHeader}>
                          <div style={styles.unitBadge}>H7</div>
                          <div>
                            <p style={styles.waterTenantName}>{tenant7?.full_name || 'no tenant'}</p>
                            <p style={styles.waterCurrentBill}>
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
                          <button onClick={() => handleSaveWaterBill(7, newWater7)} style={styles.waterSaveBtn}>Save</button>
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const unit8 = units.find(u => u.unit_number === 8);
                    const tenant8 = tenants.find(t => t.unit_id === 8 && t.status === 'active');
                    return (
                      <div style={styles.waterCard}>
                        <div style={styles.waterCardHeader}>
                          <div style={styles.unitBadge}>H8</div>
                          <div>
                            <p style={styles.waterTenantName}>{tenant8?.full_name || 'no tenant'}</p>
                            <p style={styles.waterCurrentBill}>
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
                          <button onClick={() => handleSaveWaterBill(8, newWater8)} style={styles.waterSaveBtn}>Save</button>
                        </div>
                      </div>
                    );
                  })()}

                  <button onClick={handleSaveMonthlyBills} style={styles.saveMonthBtn}>Save Monthly Bills</button>

                  <div style={styles.card}>
                    <p style={styles.cardTitle}>Water Bill History</p>
                    <div style={styles.waterTableHeader}>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700 }}>Month</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>House 7</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>House 8</p>
                      <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>Total</p>
                    </div>
                    {waterHistory.map((record) => (
                      <div key={record.id} style={styles.waterTableRow}>
                        <p style={styles.waterTableCell}>{record.month}</p>
                        <p style={{ ...styles.waterTableCell, textAlign: 'right', color: '#5635' }}>Ksh {record.house7.toLocaleString()}</p>
                        <p style={{ ...styles.waterTableCell, textAlign: 'right', color: '#5635' }}>Ksh {record.house8.toLocaleString()}</p>
                        <p style={{ ...styles.waterTableCell, textAlign: 'right', color: '#5635' }}>Ksh {(record.house7 + record.house8).toLocaleString()}</p>
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