import React, { useState, useEffect } from 'react';
import useIdleLogout from '../../hooks/useIdleLogout';
import useBackButtonLogout from '../../hooks/useBackButtonLogout';
import { API_BASE } from '../../config';

function getNextBillingPeriod(bills) {
  if (!bills || bills.length === 0) {
    const now = new Date();
    return { month: now.toLocaleString('en-US', { month: 'long' }), year: now.getFullYear() };
  }
  const latest = bills.reduce((a, b) =>
    new Date(`${b.month} 1, ${b.year}`) > new Date(`${a.month} 1, ${a.year}`) ? b : a
  );
  const next = new Date(`${latest.month} 1, ${latest.year}`);
  next.setMonth(next.getMonth() + 1);
  return { month: next.toLocaleString('en-US', { month: 'long' }), year: next.getFullYear() };
}

function AgentDashboard() {

  useIdleLogout(2.0);
  useBackButtonLogout();

  const [agent, setAgent]       = useState(null);
  const [property, setProperty] = useState(null);
  const [tenants, setTenants]   = useState([]);
  const [pending, setPending]   = useState([]);
  const [units, setUnits]       = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [viewingInvoicesFor, setViewingInvoicesFor] = useState(null);
  const [waterHistory, setWaterHistory]     = useState([]);
  const [nextPeriods, setNextPeriods]       = useState({});
  const [newWaterAmounts, setNewWaterAmounts] = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activePage, setActivePage] = useState('tenants');

  const [vacatingTenant, setVacatingTenant]   = useState(null);
  const [vacatePreview, setVacatePreview]     = useState(null);
  const [deductionRows, setDeductionRows]     = useState([]);
  const [vacatePhotos, setVacatePhotos]       = useState([null, null, null]);
  const [vacateSubmitting, setVacateSubmitting] = useState(false);
  const [viewingDeductionsFor, setViewingDeductionsFor] = useState(null);
  const [deductionsData, setDeductionsData]   = useState(null);

  const [newFullName, setNewFullName]   = useState('');
  const [newUsername, setNewUsername]   = useState('');
  const [newPhone, setNewPhone]         = useState('');
  const [newIdNumber, setNewIdNumber]   = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [newUnitId, setNewUnitId]       = useState('');
  const [addError, setAddError]         = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [newExpCategory, setNewExpCategory]       = useState('Repairs');
  const [newExpDescription, setNewExpDescription] = useState('');
  const [newExpAmount, setNewExpAmount]           = useState('');
  const [newExpDate, setNewExpDate]               = useState(() => new Date().toISOString().slice(0, 10));

  const [manualUnitId, setManualUnitId]         = useState('');
  const [manualAmount, setManualAmount]         = useState('');
  const [manualPhone, setManualPhone]           = useState('');
  const [manualMpesaCode, setManualMpesaCode]   = useState('');
  const [manualDate, setManualDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [manualMonth, setManualMonth]           = useState(() => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  const [manualError, setManualError]           = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  async function loadTenants() {
    try {
      const res = await fetch(`${API_BASE}/api/agents/me/tenants`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setTenants(data);
      } else {
        setError(data.error || 'Could not load your tenants.');
      }
    } catch (err) {
      setError('Could not reach the server.');
    }
  }

  async function loadPending() {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/pending`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPending(data);
    } catch (err) {
      console.error('Could not load pending applications:', err);
    }
  }

  async function loadUnits() {
    try {
      const res = await fetch(`${API_BASE}/api/units`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setUnits(data);
        return data;
      }
    } catch (err) {
      console.error('Could not load units:', err);
    }
    return [];
  }

  async function loadExpenses() {
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {
      console.error('Could not load expenses:', err);
    }
  }

  async function loadPayments() {
    try {
      const res = await fetch(`${API_BASE}/api/payments`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPayments(data);
    } catch (err) {
      console.error('Could not load payments:', err);
    }
  }

  async function loadInvoices() {
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setInvoices(data);
    } catch (err) {
      console.error('Could not load invoices:', err);
    }
  }

  function toggleTenantInvoices(tenantId) {
    setViewingInvoicesFor((prev) => (prev === tenantId ? null : tenantId));
  }

  async function handleRecordManualPayment() {
    if (!manualUnitId || !manualAmount || !manualPhone || !manualDate || !manualMonth) {
      setManualError('Unit, amount, phone used, date, and month are all required.');
      return;
    }
    setManualError('');
    setSubmittingManual(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          unit_id: parseInt(manualUnitId, 10),
          amount: parseFloat(manualAmount),
          mpesa_code: manualMpesaCode || undefined,
          phone_used: manualPhone,
          payment_date: manualDate,
          month: manualMonth,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setManualError(data.error || 'Could not record payment.');
        return;
      }
      await loadPayments();
      await loadTenants();
      await loadInvoices();
      setManualUnitId('');
      setManualAmount('');
      setManualPhone('');
      setManualMpesaCode('');

      if (data.allocations && data.allocations.length > 0) {
        const summary = data.allocations
          .map((a) => `${a.invoice_no} (${a.month}): Ksh ${a.amount_applied.toLocaleString()} — ${a.status.toUpperCase()}`)
          .join('\n');
        alert(`Payment recorded. Applied to:\n${summary}`);
      } else {
        alert('Payment recorded, but no outstanding invoice was found to apply it to.');
      }
    } catch (err) {
      setManualError('Could not reach the server.');
    } finally {
      setSubmittingManual(false);
    }
  }

  async function loadWaterBills(unitsList) {
    const waterUnits = (unitsList || units).filter((u) => u.has_water_bill);
    if (waterUnits.length === 0) {
      setWaterHistory([]);
      setNextPeriods({});
      return;
    }

    try {
      const responses = await Promise.all(
        waterUnits.map((u) =>
          fetch(`${API_BASE}/api/water-bills/${u.unit_id}`, { credentials: 'include' })
        )
      );
      if (responses.some((r) => !r.ok)) return;
      const dataByUnit = await Promise.all(responses.map((r) => r.json()));

      const periods = {};
      const flat = [];
      waterUnits.forEach((u, i) => {
        const bills = dataByUnit[i];
        periods[u.unit_id] = getNextBillingPeriod(bills);
        bills.forEach((b) => flat.push({ ...b, unit_number: u.unit_number }));
      });
      flat.sort((a, b) => b.bill_id - a.bill_id);

      setNextPeriods(periods);
      setWaterHistory(flat);
    } catch (err) {
      console.error('Could not load water bills:', err);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        const me = await meRes.json();
        if (!meRes.ok) {
          setError(me.error || 'Could not load your details.');
          return;
        }
        setAgent(me);

        if (me.assigned_property_id) {
          const propRes = await fetch(`${API_BASE}/api/properties/${me.assigned_property_id}`, {
            credentials: 'include',
          });
          const propData = await propRes.json();
          if (propRes.ok) setProperty(propData);
        }

        await loadTenants();
        await loadPending();
        const unitsData = await loadUnits();
        await loadWaterBills(unitsData);
        await loadExpenses();
        await loadPayments();
        await loadInvoices();
        await loadPasswordResetRequests();
      } catch (err) {
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      window.location.href = '/login';
    });
  }

  async function loadPasswordResetRequests() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset-requests`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPasswordResetRequests(data);
    } catch (err) {
      console.error('Could not load password reset requests:', err);
    }
  }

  async function handleApprovePasswordReset(userId) {
    const confirmed = window.confirm('Reset this tenant\'s password? A new temporary password will be generated.');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset-requests/${userId}/approve`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not reset password.');
        return;
      }
      await loadPasswordResetRequests();
      alert(`Password reset. Temporary password: ${data.temp_password}\n\nShare this with the tenant directly.`);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDismissPasswordReset(userId) {
    const confirmed = window.confirm('Dismiss this reset request without changing the password?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/password-reset-requests/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not dismiss request.');
        return;
      }
      await loadPasswordResetRequests();
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleMarkDeposit(tenant) {
    const expected = tenant.unit_deposit_amount ?? 0;
    const amountStr = window.prompt(
      `Enter the deposit amount received from ${tenant.full_name}:`,
      expected ? String(expected) : ''
    );
    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Enter a valid deposit amount.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/deposit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount_paid: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not record deposit.');
        return;
      }
      await loadTenants();
      alert('Deposit recorded.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleVerifyId(tenant) {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/verify-id`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not verify ID.');
        return;
      }
      await loadTenants();
      if (data.first_invoice) {
        alert(`${data.message}\n\nFirst invoice generated: Ksh ${data.first_invoice.rent_amount.toLocaleString()} for ${data.first_invoice.month} (no penalty applies to this one).`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleRequestId(tenant) {
    const confirmed = window.confirm(
      `Ask ${tenant.full_name} to submit a fresh ID/passport photo? They'll see this prompt next time they open their dashboard.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/request-id`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not request ID.');
        return;
      }
      await loadTenants();
      alert(data.message);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function downloadFile(url, filename) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        alert('Could not generate the file.');
        return;
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadAgreement(tenant) {
    await downloadFile(
      `${API_BASE}/api/tenants/${tenant.user_id}/agreement/pdf`,
      `tenancy-agreement-house-${tenant.unit_number}.pdf`
    );
  }

  async function handleDownloadPaymentReceipt(paymentId) {
    await downloadFile(
      `${API_BASE}/api/payments/${paymentId}/receipt/pdf`,
      `receipt-RCT-${String(paymentId).padStart(5, '0')}.pdf`
    );
  }

  async function handleApprovePending(applicantId) {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${applicantId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not approve applicant.');
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

  async function handleRejectPending(applicantId) {
    const confirmed = window.confirm('Reject and remove this applicant?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${applicantId}/reject`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not reject applicant.');
        return;
      }
      await loadPending();
      alert('Applicant rejected.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleAddTenant() {
    if (!newFullName.trim() || !newUsername.trim() || !newPhone.trim() || !newPassword.trim() || !newUnitId) {
      setAddError('Full name, username, phone, password, and unit are required.');
      return;
    }

    setAddError('');
    setAddSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents/me/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: newFullName.trim(),
          username: newUsername.trim(),
          phone: newPhone.trim(),
          id_number: newIdNumber.trim(),
          password: newPassword,
          unit_id: parseInt(newUnitId, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Could not add tenant.');
        setAddSubmitting(false);
        return;
      }
      await loadTenants();
      await loadUnits();
      setNewFullName('');
      setNewUsername('');
      setNewPhone('');
      setNewIdNumber('');
      setNewPassword('');
      setNewUnitId('');
      alert(data.message);
    } catch (err) {
      setAddError('Could not reach the server.');
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleAddExpense() {
    if (!newExpDescription.trim() || !newExpAmount || !newExpDate) {
      alert('Description, amount, and date are required.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: newExpCategory,
          description: newExpDescription.trim(),
          amount: parseFloat(newExpAmount),
          expense_date: newExpDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not record expense.');
        return;
      }
      await loadExpenses();
      setNewExpDescription('');
      setNewExpAmount('');
      alert('Expense recorded.');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleConfirmWaterBill(unit, amount) {
    if (!amount || parseInt(amount, 10) < 1) {
      alert('Enter a valid amount.');
      return;
    }
    const period = nextPeriods[unit.unit_id];
    if (!period) {
      alert('Billing period not loaded yet, try again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/water-bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unit_id: unit.unit_id, amount: parseInt(amount, 10), month: period.month, year: period.year }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not confirm water bill.');
        return;
      }
      await loadWaterBills();
      setNewWaterAmounts((prev) => ({ ...prev, [unit.unit_id]: '' }));
      alert(
        data.tenant_notified
          ? `House ${unit.unit_number} water payment confirmed. Tenant notified.`
          : `House ${unit.unit_number} water payment confirmed. (No active tenant to notify.)`
      );
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleDownloadWaterReceipt(billId) {
    await downloadFile(
      `${API_BASE}/api/water-bills/${billId}/receipt/pdf`,
      `water-receipt-WTR-${String(billId).padStart(5, '0')}.pdf`
    );
  }

  async function handleOpenVacate(tenant) {
    setVacatingTenant(tenant);
    setVacatePreview(null);
    setDeductionRows([]);
    setVacatePhotos([null, null, null]);

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/vacate-preview`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not load vacate preview.');
        setVacatingTenant(null);
        return;
      }
      setVacatePreview(data);
    } catch (err) {
      alert('Could not reach the server.');
      setVacatingTenant(null);
    }
  }

  function handleCancelVacate() {
    setVacatingTenant(null);
    setVacatePreview(null);
    setDeductionRows([]);
    setVacatePhotos([null, null, null]);
  }

  function handleAddDeductionRow() {
    setDeductionRows([...deductionRows, { reason: '', amount: '' }]);
  }

  function handleRemoveDeductionRow(index) {
    setDeductionRows(deductionRows.filter((_, i) => i !== index));
  }

  function handleDeductionChange(index, field, value) {
    setDeductionRows(deductionRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function handlePhotoChange(index, file) {
    setVacatePhotos(vacatePhotos.map((p, i) => (i === index ? file : p)));
  }

  function getTotalDeductions() {
    return deductionRows.reduce((sum, row) => {
      const amount = parseFloat(row.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }

  function getLiveRefund() {
    if (!vacatePreview) return 0;
    return vacatePreview.refund_amount - getTotalDeductions();
  }

  async function handleConfirmVacate() {
    if (!vacatingTenant) return;

    const validDeductions = deductionRows
      .map((row) => ({ reason: row.reason.trim(), amount: parseFloat(row.amount) }))
      .filter((row) => row.reason && !isNaN(row.amount) && row.amount > 0);

    setVacateSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('deductions', JSON.stringify(validDeductions));
      vacatePhotos.forEach((file, i) => {
        if (file) formData.append(`photo${i + 1}`, file);
      });

      const res = await fetch(`${API_BASE}/api/tenants/${vacatingTenant.user_id}/vacate`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not vacate tenant.');
        return;
      }
      await loadTenants();
      await loadUnits();
      handleCancelVacate();
      alert(
        data.refund_amount >= 0
          ? `Tenant vacated. Deposit refund due: Ksh ${data.refund_amount.toLocaleString()}`
          : `Tenant vacated. Tenant still owes: Ksh ${Math.abs(data.refund_amount).toLocaleString()}`
      );
    } catch (err) {
      alert('Could not reach the server.');
    } finally {
      setVacateSubmitting(false);
    }
  }

  async function handleViewDeductions(tenantId) {
    if (viewingDeductionsFor === tenantId) {
      setViewingDeductionsFor(null);
      setDeductionsData(null);
      return;
    }
    setViewingDeductionsFor(tenantId);
    setDeductionsData(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/deductions`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setDeductionsData(data);
    } catch (err) {
      console.error('Could not load deductions:', err);
    }
  }

  async function handleDownloadVacateReceipt(tenantId) {
    await downloadFile(
      `${API_BASE}/api/tenants/${tenantId}/vacate-receipt/pdf`,
      `vacate-receipt-${tenantId}.pdf`
    );
  }

  async function handleUnvacate(tenant) {
    const confirmed = window.confirm(`Restore ${tenant.full_name} to active status in House ${tenant.unit_number}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/unvacate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unit_id: tenant.unit_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not restore tenant.');
        return;
      }
      await loadTenants();
      await loadUnits();
      alert(data.message);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  if (loading) return <div style={styles.centered}><p>Loading...</p></div>;
  if (error)   return <div style={styles.centered}><p style={{ color: 'var(--color-danger-strong)' }}>⚠ {error}</p></div>;

  const activeTenants = tenants.filter((t) => t.status === 'active');
  const vacatedTenants = tenants.filter((t) => t.status === 'vacated');
  const depositsPending = activeTenants.filter((t) => !t.deposit_paid).length;
  const availableUnits = units.filter((u) => (u.status || '').toUpperCase() === 'AVAILABLE');
  const waterUnits = units.filter((u) => u.has_water_bill);

  const navItems = [
    { key: 'tenants', label: 'Tenants', icon: '👥' },
    { key: 'pending', label: `Pending (${pending.length})`, icon: '⏳' },
    { key: 'add', label: 'Add Tenant', icon: '➕' },
    { key: 'payments', label: 'Payments', icon: '💰' },
    { key: 'water', label: 'Water Bills', icon: '💧' },
    { key: 'expenses', label: 'Expenses', icon: '🧾' },
    { key: 'reset-requests', label: `Password Resets (${passwordResetRequests.length})`, icon: '🔑' },
  ];

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.headerLabel}>Agent</p>
            <h2 style={styles.headerName}>{agent?.full_name}</h2>
            <p style={styles.headerSub}>
              {property ? `${property.name} · ${property.location}` : 'No property assigned'}
            </p>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>

        <div style={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              style={{
                ...styles.navBtn,
                backgroundColor: activePage === item.key ? 'rgba(255,255,255,0.3)' : 'transparent',
                fontWeight: activePage === item.key ? 700 : 400,
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={styles.content}>

        {/* TENANTS */}
        {activePage === 'tenants' && (
          <div>
            <div style={styles.summaryRow}>
              <div style={styles.summaryCard}>
                <p style={styles.summaryValue}>{activeTenants.length}</p>
                <p style={styles.summaryLabel}>Active Tenants</p>
              </div>
              <div style={styles.summaryCard}>
                <p style={styles.summaryValue}>{depositsPending}</p>
                <p style={styles.summaryLabel}>Deposits Pending</p>
              </div>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Tenants — House &amp; Rent Status</p>

              {activeTenants.length === 0 ? (
                <p style={styles.placeholderText}>No tenants in your assigned property yet.</p>
              ) : (
                activeTenants.map((tenant) => (
                  <React.Fragment key={tenant.user_id}>
                    <div style={styles.tenantRow}>
                      <div style={styles.unitBadge}>H{tenant.unit_number}</div>
                      <div style={styles.tenantInfo}>
                        <p style={styles.tenantName}>{tenant.full_name}</p>
                        <p style={styles.tenantDetails}>@{tenant.username} · {tenant.phone}</p>
                        <p style={styles.tenantDetails}>Rent Ksh {tenant.rent_amount.toLocaleString()}</p>
                        <p style={styles.tenantDetails}>
                          Agreement: {tenant.agreement_signed ? '✓ Signed' : '— Not signed'}
                          {' · '}
                          Deposit: {tenant.deposit_paid
                            ? `✓ Ksh ${(tenant.deposit_amount_paid ?? 0).toLocaleString()} paid`
                            : `— Pending (Ksh ${(tenant.unit_deposit_amount ?? 0).toLocaleString()} expected)`}
                        </p>
                      </div>

                      <div style={styles.tenantActions}>
                        <button
                          onClick={() => toggleTenantInvoices(tenant.user_id)}
                          title="Click to see month-by-month payment status"
                          style={{
                            ...styles.statusBadge,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: tenant.current_status === 'paid' ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
                            color: tenant.current_status === 'paid' ? 'var(--color-brand)' : 'var(--color-danger-strong)',
                          }}
                        >
                          {tenant.current_status.toUpperCase()} {viewingInvoicesFor === tenant.user_id ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {viewingInvoicesFor === tenant.user_id && (
                      <div style={{ ...styles.vacatePanel, marginLeft: '56px' }}>
                        <p style={styles.cardTitle}>Payment Status by Month</p>
                        {(() => {
                          const tenantInvoices = invoices
                            .filter((inv) => inv.tenant_id === tenant.user_id)
                            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                          if (tenantInvoices.length === 0) {
                            return <p style={styles.placeholderText}>No invoices generated for this tenant yet.</p>;
                          }
                          return tenantInvoices.map((inv) => (
                            <div key={inv.invoice_id} style={styles.deductionRow}>
                              <p style={{ flex: 1, fontSize: '13px', color: 'var(--color-ink-soft)', margin: 0 }}>
                                {inv.month}
                              </p>
                              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0 }}>
                                {inv.status === 'partial' ? `Ksh ${inv.amount_paid.toLocaleString()} of ${inv.total_amount.toLocaleString()}` : `Ksh ${inv.total_amount.toLocaleString()}`}
                              </p>
                              <span style={{
                                ...styles.statusBadge,
                                backgroundColor: inv.status === 'paid' ? 'var(--color-primary-light)' : inv.status === 'partial' ? 'var(--color-warning-soft)' : 'var(--color-danger-light)',
                                color: inv.status === 'paid' ? 'var(--color-brand)' : inv.status === 'partial' ? 'var(--color-warning)' : 'var(--color-danger-strong)',
                              }}>
                                {inv.status.toUpperCase()}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '0 0 16px 56px' }}>
                      {!tenant.deposit_paid ? (
                        <button onClick={() => handleMarkDeposit(tenant)} style={styles.saveBtn}>
                          Mark Deposit Paid
                        </button>
                      ) : (
                        <span style={{ ...styles.editBtn, cursor: 'default' }}>✓ Deposit Recorded</span>
                      )}
                      {tenant.id_photo_path ? (
                        <>
                          <a
                            href={`${API_BASE}${tenant.id_photo_path}`}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.editBtn}
                          >
                            🪪 View ID
                          </a>
                          {tenant.id_photo_verified ? (
                            <span style={{ ...styles.editBtn, cursor: 'default', backgroundColor: 'var(--color-primary-light)' }}>
                              ✓ Contract Approved
                            </span>
                          ) : (
                            <button onClick={() => handleVerifyId(tenant)} style={styles.saveBtn}>
                              Approve Contract
                            </button>
                          )}
                        </>
                      ) : tenant.id_photo_requested ? (
                        <span style={{ ...styles.editBtn, cursor: 'default' }}>⏳ ID Requested</span>
                      ) : (
                        <button onClick={() => handleRequestId(tenant)} style={styles.editBtn}>
                          🪪 Request ID
                        </button>
                      )}
                      {tenant.agreement_signed && (
                        <button onClick={() => handleDownloadAgreement(tenant)} style={styles.editBtn}>
                          📄 Agreement
                        </button>
                      )}
                      <button onClick={() => handleOpenVacate(tenant)} style={styles.vacateBtn}>Vacate</button>
                    </div>

                    {vacatingTenant?.user_id === tenant.user_id && (
                      <div style={styles.vacatePanel}>
                        {!vacatePreview ? (
                          <p style={styles.placeholderText}>Loading deposit settlement...</p>
                        ) : (
                          <>
                            <p style={styles.cardTitle}>Vacate {vacatePreview.tenant_name}</p>

                            <div style={styles.vacateSummaryRow}>
                              <div>
                                <p style={styles.filterLabel}>Deposit Paid</p>
                                <p style={styles.vacateSummaryValue}>Ksh {vacatePreview.deposit_paid.toLocaleString()}</p>
                              </div>
                              <div>
                                <p style={styles.filterLabel}>Outstanding Rent</p>
                                <p style={{ ...styles.vacateSummaryValue, color: 'var(--color-danger-strong)' }}>
                                  Ksh {vacatePreview.outstanding_owed.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p style={styles.filterLabel}>Deductions</p>
                                <p style={{ ...styles.vacateSummaryValue, color: 'var(--color-danger-strong)' }}>
                                  Ksh {getTotalDeductions().toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p style={styles.filterLabel}>{getLiveRefund() >= 0 ? 'Refund Due' : 'Tenant Owes'}</p>
                                <p style={{ ...styles.vacateSummaryValue, color: getLiveRefund() >= 0 ? 'var(--color-brand)' : 'var(--color-danger-strong)' }}>
                                  Ksh {Math.abs(getLiveRefund()).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {vacatePreview.outstanding_invoices.length > 0 && (
                              <p style={styles.vacateNote}>
                                These invoices will be voided: {vacatePreview.outstanding_invoices.map((inv) => `${inv.invoice_no} (Ksh ${inv.balance_due.toLocaleString()})`).join(', ')}
                              </p>
                            )}

                            <p style={{ ...styles.filterLabel, marginTop: '16px' }}>Deposit Deductions (optional)</p>
                            {deductionRows.map((row, i) => (
                              <div key={i} style={styles.deductionRow}>
                                <input
                                  type="text"
                                  placeholder="Reason e.g. Broken window"
                                  value={row.reason}
                                  onChange={(e) => handleDeductionChange(i, 'reason', e.target.value)}
                                  style={{ ...styles.filterSelect, flex: 1 }}
                                />
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={row.amount}
                                  onChange={(e) => handleDeductionChange(i, 'amount', e.target.value)}
                                  style={{ ...styles.filterSelect, width: '120px' }}
                                />
                                <button onClick={() => handleRemoveDeductionRow(i)} style={styles.deleteBtn}>Remove</button>
                              </div>
                            ))}
                            <button onClick={handleAddDeductionRow} style={{ ...styles.editBtn, marginTop: '8px' }}>
                              + Add Row
                            </button>

                            <p style={{ ...styles.filterLabel, marginTop: '16px' }}>Evidence Photos (up to 3)</p>
                            <div style={styles.photoRow}>
                              {[0, 1, 2].map((i) => (
                                <input
                                  key={i}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handlePhotoChange(i, e.target.files[0] || null)}
                                  style={styles.photoInput}
                                />
                              ))}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                              <button onClick={handleConfirmVacate} disabled={vacateSubmitting} style={styles.vacateBtn}>
                                {vacateSubmitting ? 'Vacating...' : 'Confirm Vacate'}
                              </button>
                              <button onClick={handleCancelVacate} style={styles.cancelBtn}>Cancel</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Vacated Tenants ({vacatedTenants.length})</p>
              {vacatedTenants.length === 0 ? (
                <p style={styles.placeholderText}>No vacated tenants yet.</p>
              ) : (
                vacatedTenants.map((tenant) => (
                  <React.Fragment key={tenant.user_id}>
                    <div style={styles.tenantRow}>
                      <div style={{ ...styles.unitBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-muted)' }}>—</div>
                      <div style={styles.tenantInfo}>
                        <p style={{ ...styles.tenantName, color: 'var(--color-muted)' }}>{tenant.full_name}</p>
                        <p style={styles.tenantDetails}>@{tenant.username} · {tenant.phone}</p>
                      </div>
                      <span style={{ ...styles.statusBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-muted)' }}>VACATED</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '0 0 16px 56px' }}>
                      <button onClick={() => handleViewDeductions(tenant.user_id)} style={styles.editBtn}>
                        {viewingDeductionsFor === tenant.user_id ? 'Hide Deductions' : 'View Deductions'}
                      </button>
                      <button onClick={() => handleDownloadVacateReceipt(tenant.user_id)} style={styles.editBtn}>
                        📄 Vacate Receipt
                      </button>
                      <button onClick={() => handleUnvacate(tenant)} style={styles.saveBtn}>
                        Undo Vacate
                      </button>
                    </div>

                    {viewingDeductionsFor === tenant.user_id && (
                      <div style={styles.vacatePanel}>
                        {!deductionsData ? (
                          <p style={styles.placeholderText}>Loading...</p>
                        ) : deductionsData.deductions.length === 0 && deductionsData.photos.length === 0 ? (
                          <p style={styles.placeholderText}>No deposit deductions or evidence were recorded for this tenant.</p>
                        ) : (
                          <>
                            {deductionsData.deductions.map((d) => (
                              <div key={d.deduction_id} style={styles.deductionRow}>
                                <p style={{ flex: 1, fontSize: '13px', color: 'var(--color-ink-soft)', margin: 0 }}>{d.reason}</p>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger-strong)', margin: 0 }}>
                                  Ksh {d.amount.toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {deductionsData.photos.length > 0 && (
                              <div style={styles.photoRow}>
                                {deductionsData.photos.map((p) => (
                                  <a key={p.photo_id} href={`${API_BASE}${p.file_path}`} target="_blank" rel="noreferrer">
                                    <img src={`${API_BASE}${p.file_path}`} alt="Evidence" style={styles.evidenceThumb} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        )}

        {/* PENDING */}
        {activePage === 'pending' && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Pending Applications ({pending.length})</p>
            {pending.length === 0 ? (
              <p style={styles.placeholderText}>No pending applications for your property.</p>
            ) : (
              pending.map((applicant) => (
                <div key={applicant.user_id} style={styles.tenantRow}>
                  <div style={styles.unitBadge}>H{applicant.unit_id ?? '—'}</div>
                  <div style={styles.tenantInfo}>
                    <p style={styles.tenantName}>{applicant.full_name}</p>
                    <p style={styles.tenantDetails}>@{applicant.username} · {applicant.phone}</p>
                    <p style={styles.tenantDetails}>Applied: {applicant.created_at}</p>
                  </div>
                  <div style={styles.tenantActions}>
                    <button onClick={() => handleApprovePending(applicant.user_id)} style={styles.saveBtn}>Approve</button>
                    <button onClick={() => handleRejectPending(applicant.user_id)} style={styles.deleteBtn}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADD TENANT */}
        {activePage === 'add' && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Add Walk-In Tenant</p>
            <p style={styles.vacateNote}>
              This activates the tenant immediately in your assigned property — no approval step needed.
            </p>

            <div style={styles.editRow}>
              <div style={styles.editField}>
                <p style={styles.editLabel}>Full Name</p>
                <input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} style={styles.editInput} />
              </div>
              <div style={styles.editField}>
                <p style={styles.editLabel}>Username</p>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={styles.editInput} />
              </div>
              <div style={styles.editField}>
                <p style={styles.editLabel}>Phone</p>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={styles.editInput} />
              </div>
              <div style={styles.editField}>
                <p style={styles.editLabel}>ID Number</p>
                <input value={newIdNumber} onChange={(e) => setNewIdNumber(e.target.value)} style={styles.editInput} />
              </div>
              <div style={styles.editField}>
                <p style={styles.editLabel}>Initial Password</p>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.editInput} />
              </div>
              <div style={styles.editField}>
                <p style={styles.editLabel}>House</p>
                <select value={newUnitId} onChange={(e) => setNewUnitId(e.target.value)} style={styles.statusSelect}>
                  <option value="">-- Select --</option>
                  {availableUnits.map((u) => (
                    <option key={u.unit_id} value={u.unit_id}>
                      House {u.unit_number} — Ksh {u.rent_amount.toLocaleString()}{u.has_water_bill ? ' 💧 Water Billed' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {addError && <p style={{ color: 'var(--color-danger-strong)', fontSize: '13px', marginTop: '12px' }}>{addError}</p>}

            <button onClick={handleAddTenant} disabled={addSubmitting} style={{ ...styles.saveBtn, marginTop: '16px' }}>
              {addSubmitting ? 'Adding...' : '+ Add Tenant'}
            </button>
          </div>
        )}

        {/* PAYMENTS */}
        {activePage === 'payments' && (
          <div>
            <div style={styles.card}>
              <p style={styles.cardTitle}>Record Manual Payment</p>
              <p style={styles.vacateNote}>
                For cash, bank transfer, or phone-based M-Pesa that won't come through the paybill automatically.
              </p>
              <div style={styles.editRow}>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Unit</p>
                  <select value={manualUnitId} onChange={(e) => setManualUnitId(e.target.value)} style={styles.statusSelect}>
                    <option value="">Select a unit...</option>
                    {units.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>
                        House {u.unit_number}{u.has_water_bill ? ' 💧' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Amount (Ksh)</p>
                  <input type="number" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} placeholder="e.g. 18000" style={styles.editInput} min="1" />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Phone Used</p>
                  <input type="text" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} placeholder="0712345678" style={styles.editInput} />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>M-Pesa Code (optional)</p>
                  <input type="text" value={manualMpesaCode} onChange={(e) => setManualMpesaCode(e.target.value)} placeholder="e.g. QGH7X..." style={styles.editInput} />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Payment Date</p>
                  <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} style={styles.editInput} />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Month</p>
                  <input type="text" value={manualMonth} onChange={(e) => setManualMonth(e.target.value)} placeholder="e.g. August 2026" style={styles.editInput} />
                </div>
              </div>
              <button onClick={handleRecordManualPayment} disabled={submittingManual} style={{ ...styles.saveBtn, marginTop: '16px' }}>
                {submittingManual ? 'Recording...' : '+ Record Payment'}
              </button>
              {manualError !== '' && (
                <p style={{ color: 'var(--color-danger-strong)', fontSize: '13px', margin: '12px 0 0' }}>{manualError}</p>
              )}
            </div>

            <div style={styles.card}>
            <p style={styles.cardTitle}>Payments — {property?.name || 'Your Property'}</p>
            {payments.length === 0 ? (
              <p style={styles.placeholderText}>No payments recorded yet.</p>
            ) : (
              payments.map((payment) => (
                <div key={payment.payment_id} style={styles.tenantRow}>
                  <div style={styles.unitBadge}>H{payment.unit_number}</div>
                  <div style={styles.tenantInfo}>
                    <p style={styles.tenantName}>{payment.tenant_name}</p>
                    <p style={styles.tenantDetails}>
                      Ksh {payment.amount.toLocaleString()} · {payment.month} · {payment.payment_date}
                    </p>
                  </div>
                  <div style={styles.tenantActions}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: payment.status === 'paid' ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
                      color: payment.status === 'paid' ? 'var(--color-brand)' : 'var(--color-danger-strong)',
                    }}>
                      {payment.status.toUpperCase()}
                    </span>
                    <button onClick={() => handleDownloadPaymentReceipt(payment.payment_id)} style={styles.editBtn}>
                      📄 Receipt
                    </button>
                  </div>
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
              <p style={styles.cardTitle}>Confirm Water Payment</p>
              <p style={styles.vacateNote}>
                Water is paid directly to Eldowas and billed separately from rent. When Eldowas sends you a
                confirmation, record it here — the tenant is notified automatically and a receipt is generated.
              </p>
              {waterUnits.length === 0 ? (
                <p style={styles.placeholderText}>No units in your property have water billing enabled.</p>
              ) : (
                waterUnits.map((unit) => {
                  const occupant = activeTenants.find((t) => t.unit_id === unit.unit_id);
                  const period = nextPeriods[unit.unit_id];
                  return (
                    <div key={unit.unit_id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>H{unit.unit_number}</div>
                      <div style={styles.tenantInfo}>
                        <p style={styles.tenantName}>{occupant?.full_name || 'No tenant'}</p>
                        <p style={styles.tenantDetails}>
                          Billing for: {period ? `${period.month} ${period.year}` : '...'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={newWaterAmounts[unit.unit_id] || ''}
                          onChange={(e) => setNewWaterAmounts((prev) => ({ ...prev, [unit.unit_id]: e.target.value }))}
                          placeholder="Amount"
                          style={{ ...styles.editInput, width: '100px' }}
                        />
                        <button onClick={() => handleConfirmWaterBill(unit, newWaterAmounts[unit.unit_id])} style={styles.saveBtn}>
                          Confirm Payment
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Water Bill History</p>
              {waterHistory.length === 0 ? (
                <p style={styles.placeholderText}>No water bills recorded yet.</p>
              ) : (
                waterHistory.map((bill) => (
                  <div key={bill.bill_id} style={styles.deductionRow}>
                    <span style={{ ...styles.statusBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-ink-soft)' }}>
                      H{bill.unit_number}
                    </span>
                    <p style={{ flex: 1, fontSize: '13px', color: 'var(--color-ink-soft)', margin: 0 }}>
                      {bill.month} {bill.year}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                      Ksh {bill.amount.toLocaleString()}
                    </p>
                    <button onClick={() => handleDownloadWaterReceipt(bill.bill_id)} style={styles.editBtn}>
                      📄 Receipt
                    </button>
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
              <p style={styles.cardTitle}>Log an Expense</p>
              <div style={styles.editRow}>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Category</p>
                  <select value={newExpCategory} onChange={(e) => setNewExpCategory(e.target.value)} style={styles.statusSelect}>
                    <option value="Repairs">Repairs</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Description</p>
                  <input value={newExpDescription} onChange={(e) => setNewExpDescription(e.target.value)} style={styles.editInput} />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Amount (Ksh)</p>
                  <input type="number" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} style={styles.editInput} />
                </div>
                <div style={styles.editField}>
                  <p style={styles.editLabel}>Date</p>
                  <input type="date" value={newExpDate} onChange={(e) => setNewExpDate(e.target.value)} style={styles.editInput} />
                </div>
              </div>
              <button onClick={handleAddExpense} style={{ ...styles.saveBtn, marginTop: '16px' }}>+ Add Expense</button>
            </div>

            <div style={styles.card}>
              <p style={styles.cardTitle}>Expenses — {property?.name || 'Your Property'}</p>
              {expenses.length === 0 ? (
                <p style={styles.placeholderText}>No expenses logged yet.</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.expense_id} style={styles.deductionRow}>
                    <span style={{ ...styles.statusBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-ink-soft)' }}>
                      {expense.category}
                    </span>
                    <p style={{ flex: 1, fontSize: '13px', color: 'var(--color-ink-soft)', margin: 0 }}>
                      {expense.description} · {expense.expense_date}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-danger-strong)', margin: 0 }}>
                      Ksh {expense.amount.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PASSWORD RESET REQUESTS */}
        {activePage === 'reset-requests' && (
          <div style={styles.card}>
            <p style={styles.cardTitle}>Password Reset Requests ({passwordResetRequests.length})</p>
            {passwordResetRequests.length === 0 ? (
              <p style={styles.placeholderText}>No pending password reset requests for your tenants.</p>
            ) : (
              passwordResetRequests.map((req) => (
                <div key={req.user_id} style={styles.tenantRow}>
                  <div style={styles.unitBadge}>🔑</div>
                  <div style={styles.tenantInfo}>
                    <p style={styles.tenantName}>{req.full_name}</p>
                    <p style={styles.tenantDetails}>@{req.username} · {req.phone}</p>
                    <p style={styles.tenantDetails}>Requested: {req.password_reset_requested_at}</p>
                  </div>
                  <div style={styles.tenantActions}>
                    <button onClick={() => handleApprovePasswordReset(req.user_id)} style={styles.saveBtn}>
                      Reset Password
                    </button>
                    <button onClick={() => handleDismissPasswordReset(req.user_id)} style={styles.deleteBtn}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const GREEN = 'var(--color-brand)';

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-alt)',
    fontFamily: 'var(--font-sans)',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  header: {
    backgroundColor: GREEN,
    color: 'var(--color-text-on-brand)',
    padding: '24px 32px 0',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
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
    color: 'var(--color-text-on-brand)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  navBtn: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    color: 'var(--color-text-on-brand)',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  content: {
    flex: 1,
    padding: '24px 32px',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    flex: '1 1 140px',
    background: 'var(--color-surface)',
    borderRadius: '14px',
    padding: '20px 16px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: GREEN,
    margin: '0 0 6px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: '16px',
    marginBottom: '20px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: '0 0 20px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tenantRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 0 0',
    borderBottom: 'none',
    flexWrap: 'wrap',
  },
  tenantInfo: { flex: 1, minWidth: '200px' },
  unitBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--color-primary-light)',
    color: GREEN,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    minWidth: '40px',
  },
  tenantName: { fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: 'var(--color-ink)' },
  tenantDetails: { fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 4px' },
  tenantActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '4px',
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
  },
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid var(--color-border-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    cursor: 'pointer',
  },
  editRow: { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' },
  editField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  editLabel: { fontSize: '12px', color: 'var(--color-muted)', margin: 0, fontWeight: 500 },
  editInput: {
    width: '160px',
    padding: '8px 12px',
    border: '1.5px solid var(--color-brand)',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
  },
  editBtn: {
    padding: '8px 18px',
    backgroundColor: 'var(--color-primary-light)',
    color: GREEN,
    border: '1px solid var(--color-success-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  saveBtn: {
    padding: '8px 18px',
    backgroundColor: GREEN,
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 18px',
    backgroundColor: 'var(--color-bg-alt)',
    color: 'var(--color-ink-soft)',
    border: '1px solid var(--color-border-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '6px 14px',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger-strong)',
    border: '1px solid var(--color-danger-soft)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  vacateBtn: {
    padding: '8px 18px',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger-strong)',
    border: '1px solid var(--color-danger-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  vacatePanel: {
    backgroundColor: 'var(--color-surface-alt)',
    border: '1.5px dashed var(--color-border-soft)',
    borderRadius: '12px',
    padding: '20px',
    margin: '4px 0 16px 56px',
  },
  vacateSummaryRow: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '12px', marginBottom: '12px' },
  vacateSummaryValue: { fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: '4px 0 0' },
  vacateNote: { fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 12px', lineHeight: 1.5 },
  deductionRow: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' },
  filterLabel: {
    fontSize: '12px', color: 'var(--color-muted)', margin: 0, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1.5px solid var(--color-border-soft)',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
  },
  photoRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' },
  photoInput: { fontSize: '12px', maxWidth: '200px' },
  evidenceThumb: {
    width: '90px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid var(--color-border-soft)',
  },
  placeholderText: {
    color: 'var(--color-muted)',
    fontSize: '14px',
    textAlign: 'center',
    padding: '32px 0',
  },
};

export default AgentDashboard;
