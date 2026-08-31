import React, { useState, useEffect } from 'react';
import useIdleLogout from '../../hooks/useIdleLogout';
import useBackButtonLogout from '../../hooks/useBackButtonLogout';
import { API_BASE } from '../../config';

const mockAdmin = { name: 'James Orlando', property: 'Ace Apartments', location: 'Eldoret' };

const messageTemplates = {
  reminder: 'Dear tenant, your rent is due on the 1st. Please use the payment link sent to you via M-Pesa.',
  confirmed: 'Your payment has been received. Thank you.',
  balance: 'You have an outstanding balance. Please clear it at your earliest convenience.',
  custom: '',
};

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

function AdminDashboard() {
  useIdleLogout(2.0);
  useBackButtonLogout();
  const [waterHistory, setWaterHistory] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWaterAmounts, setNewWaterAmounts] = useState({});
  const [newAmount, setNewAmount] = useState('');
  const [allPayments, setAllPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [manualUnitId, setManualUnitId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualMpesaCode, setManualMpesaCode] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualMonth, setManualMonth] = useState(() => {
    const now = new Date();
    return `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
  });
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState('');
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
  const [vacatingTenant, setVacatingTenant] = useState(null);
  const [vacatePreview, setVacatePreview] = useState(null);
  const [deductionRows, setDeductionRows] = useState([]);
  const [vacatePhotos, setVacatePhotos] = useState([null, null, null]);
  const [vacateSubmitting, setVacateSubmitting] = useState(false);
  const [viewingDeductionsFor, setViewingDeductionsFor] = useState(null);
  const [deductionsData, setDeductionsData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyLocation, setNewPropertyLocation] = useState('');
  const [newPropertyPaybill, setNewPropertyPaybill] = useState('');
  const [newPropertyAccount, setNewPropertyAccount] = useState('');
  const [newUnitPropertyId, setNewUnitPropertyId] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitRent, setNewUnitRent] = useState('');
  const [newUnitHasWater, setNewUnitHasWater] = useState(false);
  const [newUnitWaterAmount, setNewUnitWaterAmount] = useState('');
  const [newUnitPaybill, setNewUnitPaybill] = useState('');
  const [newUnitAccount, setNewUnitAccount] = useState('');
  const [bulkPaybill, setBulkPaybill] = useState('');
  const [bulkAccount, setBulkAccount] = useState('');
  const [bulkSelectedUnits, setBulkSelectedUnits] = useState([]);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [agents, setAgents] = useState([]);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [editingUnitPaybill, setEditingUnitPaybill] = useState('');
  const [editingUnitAccount, setEditingUnitAccount] = useState('');
  const [nextPeriods, setNextPeriods] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [invoiceUnitId, setInvoiceUnitId] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadPending() {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/pending`, {
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
      const res = await fetch(`${API_BASE}/api/units`, {
        credentials: 'include',
      });
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

  async function loadProperties() {
    try {
      const res = await fetch(`${API_BASE}/api/properties`, {
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
      const res = await fetch(`${API_BASE}/api/properties`, {
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
      const res = await fetch(`${API_BASE}/api/properties/${propertyId}`, {
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
      const res = await fetch(`${API_BASE}/api/properties/${newUnitPropertyId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          unit_number: parseInt(newUnitNumber),
          rent_amount: parseInt(newUnitRent),
          has_water_bill: newUnitHasWater ? 1 : 0,
          water_bill: newUnitHasWater ? (parseInt(newUnitWaterAmount) || 0) : 0,
          paybill_no: newUnitPaybill.trim() || null,
          account_no: newUnitAccount.trim() || null,
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
      setNewUnitHasWater(false);
      setNewUnitWaterAmount('');
      setNewUnitPaybill('');
      setNewUnitAccount('');
      alert('Unit added!');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function toggleBulkUnit(unitId) {
    setBulkSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  }

  function toggleBulkSelectAll() {
    setBulkSelectedUnits((prev) => (prev.length === units.length ? [] : units.map((u) => u.unit_id)));
  }

  async function handleBulkAssignPaybill() {
    if (!bulkPaybill.trim() && !bulkAccount.trim()) {
      alert('Enter a paybill number, an account number, or both.');
      return;
    }
    if (bulkSelectedUnits.length === 0) {
      alert('Select at least one unit (or use "Select All").');
      return;
    }
    setBulkApplying(true);
    try {
      const results = await Promise.all(
        bulkSelectedUnits.map((unitId) =>
          fetch(`${API_BASE}/api/units/${unitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              paybill_no: bulkPaybill.trim() || null,
              account_no: bulkAccount.trim() || null,
            }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      await loadUnits();
      setBulkSelectedUnits([]);
      if (failed > 0) {
        alert(`Applied to ${results.length - failed} unit(s). ${failed} failed — please retry those.`);
      } else {
        alert(`Paybill/account applied to ${results.length} unit(s).`);
      }
    } catch (err) {
      alert('Could not reach the server.');
    } finally {
      setBulkApplying(false);
    }
  }

  async function handleDeleteUnit(unitId) {
    const confirmed = window.confirm(
      'Delete this unit? This only works if it has no active tenant.',
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/units/${unitId}`, {
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
      const res = await fetch(`${API_BASE}/api/tenants`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setTenants(data);
    } catch (err) {
      console.error('Could not load tenants:', err);
    }
  }

  async function downloadPdf(url, filename) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        alert('Could not generate PDF.');
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

  async function handleDownloadReceipt(paymentId) {
    await downloadPdf(
      `${API_BASE}/api/payments/${paymentId}/receipt/pdf`,
      `receipt-RCT-${String(paymentId).padStart(5, '0')}.pdf`
    );
  }

  async function handleDownloadDepositReceipt(tenantId) {
    await downloadPdf(
      `${API_BASE}/api/tenants/${tenantId}/deposit-receipt/pdf`,
      `deposit-receipt-DEP-${String(tenantId).padStart(5, '0')}.pdf`
    );
  }

  async function handleDownloadAgreement(tenant) {
    await downloadPdf(
      `${API_BASE}/api/tenants/${tenant.user_id}/agreement/pdf`,
      `tenancy-agreement-house-${tenant.unit_id}.pdf`
    );
  }

  async function handleDownloadVacateReceipt(tenantId) {
    await downloadPdf(
      `${API_BASE}/api/tenants/${tenantId}/vacate-receipt/pdf`,
      `vacate-settlement-VAC-${String(tenantId).padStart(5, '0')}.pdf`
    );
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
          unit_id: parseInt(manualUnitId),
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

  async function loadPayments() {
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
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
      const res = await fetch (`${API_BASE}/api/expenses`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {
      console.error('could not load expenses:',err);
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
      const merged = {};
      waterUnits.forEach((u, i) => {
        const bills = dataByUnit[i];
        periods[u.unit_id] = getNextBillingPeriod(bills);
        bills.forEach((b) => {
          const key = `${b.month}-${b.year}`;
          merged[key] = merged[key] || { id: key, month: `${b.month} ${b.year}`, amounts: {} };
          merged[key].amounts[u.unit_id] = b.amount;
        });
      });

      setNextPeriods(periods);
      setWaterHistory(Object.values(merged));
    } catch (err) {
      console.error('Could not load water bills:', err);
    }
  }

  async function loadInvoices() {
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setInvoices(data);
    } catch (err) {
      console.error('Could not load invoices:', err);
    }
  }

  async function handleGenerateInvoice() {
    if (!invoiceUnitId) {
      setInvoiceError('Select a unit first.');
      return;
    }
    setInvoiceError('');
    setGeneratingInvoice(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unit_id: parseInt(invoiceUnitId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInvoiceError(data.error || 'Could not generate invoice.');
        return;
      }
      await loadInvoices();
      setInvoiceUnitId('');
    } catch (err) {
      setInvoiceError('Could not reach the server.');
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function handleGenerateMonthlyInvoices() {
    const confirmed = window.confirm(
      "Generate this month's invoice for every active tenant who doesn't already have one?"
    );
    if (!confirmed) return;

    setGeneratingInvoice(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/generate-monthly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not run monthly generation.');
        return;
      }
      await loadInvoices();
      alert(data.message);
    } catch (err) {
      alert('Could not reach the server.');
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function handleDownloadInvoiceReceipt(invoiceId) {
    await downloadPdf(
      `${API_BASE}/api/invoices/${invoiceId}/receipt/pdf`,
      `rent-receipt-INV-${String(invoiceId).padStart(5, '0')}.pdf`
    );
  }

  async function handleDeleteInvoice(invoiceId) {
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not delete invoice.');
        return;
      }
      await loadInvoices();
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function loadMessages() {
    try {
      const res = await fetch (`${API_BASE}/api/messages`, {
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
        const unitsData = await loadUnits();
        await loadWaterBills(unitsData);
        await loadProperties();
        await loadTenants();
        await loadPending();
        await loadPayments();
        await loadInvoices();
        await loadAgents();
        await loadPendingAgents();
        await loadPasswordResetRequests();
      } catch (err) {
        setError('Could not load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => (u.status || '').toUpperCase() === 'OCCUPIED').length;
  const availableUnits = units.filter((u) => (u.status || '').toUpperCase() === 'AVAILABLE').length;
  const pendingCount = pending.length;
  const waterUnits = units.filter((u) => u.has_water_bill);
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
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      window.location.href = '/login';
    });
  }

  async function handleApprove(userId, unitId) {
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${userId}/approve`, {
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
      const res = await fetch(`${API_BASE}/api/tenants/${userId}/reject`, {
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

  async function loadAgents() {
    try {
      const res = await fetch(`${API_BASE}/api/agents`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setAgents(data);
    } catch (err) {
      console.error('Could not load agents:', err);
    }
  }

  async function loadPendingAgents() {
    try {
      const res = await fetch(`${API_BASE}/api/agents/pending`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPendingAgents(data);
    } catch (err) {
      console.error('Could not load pending agents:', err);
    }
  }

  async function handleApproveAgent(userId) {
    try {
      const res = await fetch(`${API_BASE}/api/agents/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not approve agent.');
        return;
      }
      await loadPendingAgents();
      await loadAgents();
      alert('Agent approved!');
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  async function handleRejectAgent(userId) {
    const confirmed = window.confirm('Reject and remove this agent applicant?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/agents/${userId}/reject`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not reject agent.');
        return;
      }
      await loadPendingAgents();
      alert('Agent applicant rejected.');
    } catch (err) {
      alert('Could not reach the server.');
    }
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
    const confirmed = window.confirm('Reset this account\'s password? A new temporary password will be generated.');
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
      alert(`Password reset. Temporary password: ${data.temp_password}\n\nShare this with the user directly.`);
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

  function getPaymentColor(status) {
    if (status === 'paid') return 'var(--color-brand)';
    if (status === 'unpaid') return 'var(--color-danger-strong)';
    return 'var(--color-muted)';
  }

  function getStatusColor(status) {
    const s = (status || '').toUpperCase();
    if (s === 'OCCUPIED') return 'var(--color-brand)';
    if (s === 'AVAILABLE') return 'var(--color-info-strong)';
    if (s === 'VACATING') return 'var(--color-warning)';
    if (s === 'MAINTENANCE') return 'var(--color-danger-strong)';
    return 'var(--color-muted)';
  }

  function getStatusBg(status) {
    const s = (status || '').toUpperCase();
    if (s === 'OCCUPIED') return 'var(--color-primary-light)';
    if (s === 'AVAILABLE') return 'var(--color-info-light)';
    if (s === 'VACATING') return 'var(--color-warning-soft)';
    if (s === 'MAINTENANCE') return 'var(--color-danger-light)';
    return 'var(--color-bg-alt)';
  }

  function handleEditUnit(unit) {
    setEditingUnit(unit.unit_id);
    setEditRent(unit.rent_amount);
    setEditWater(unit.water_bill || 0);
    setEditingUnitPaybill(unit.paybill_no || '');
    setEditingUnitAccount(unit.account_no || '');
  }

  async function handleSaveUnit(unitId) {
    try {
      const res = await fetch(`${API_BASE}/api/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rent_amount: parseInt(editRent),
          water_bill: parseInt(editWater),
          paybill_no: editingUnitPaybill.trim() || null,
          account_no: editingUnitAccount.trim() || null,
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
      const res = await fetch(`${API_BASE}/api/units/${unitId}`, {
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
      await loadInvoices();
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

  async function handleViewDeductions(tenant) {
    if (viewingDeductionsFor === tenant.user_id) {
      setViewingDeductionsFor(null);
      setDeductionsData(null);
      return;
    }
    setViewingDeductionsFor(tenant.user_id);
    setDeductionsData(null);
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/deductions`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) setDeductionsData(data);
    } catch (err) {
      console.error('Could not load deductions:', err);
    }
  }

  async function handleUnvacate(tenant) {
    let unitIdToUse = tenant.unit_id;

    if (!unitIdToUse) {
      const availableUnits = units.filter((u) => (u.status || '').toUpperCase() === 'AVAILABLE');
      if (availableUnits.length === 0) {
        alert(`${tenant.full_name} has no unit on record (vacated before unit history was tracked), and there are no available units to restore them into.`);
        return;
      }
      const optionsText = availableUnits.map((u) => u.unit_number).join(', ');
      const chosen = window.prompt(
        `${tenant.full_name} has no unit on record (vacated before unit history was tracked).\n` +
        `Enter the house number to restore them into.\nAvailable: ${optionsText}`
      );
      if (chosen === null) return;
      const match = availableUnits.find((u) => String(u.unit_number) === chosen.trim());
      if (!match) {
        alert('That house number is not an available unit.');
        return;
      }
      unitIdToUse = match.unit_id;
    } else {
      const confirmed = window.confirm(
        `Restore ${tenant.full_name} to active status in their previous unit?`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenant.user_id}/unvacate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unit_id: unitIdToUse }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not restore tenant.');
        return;
      }
      await loadTenants();
      await loadUnits();
      await loadInvoices();
      alert(data.message);
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
      await loadInvoices();
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

  function getCategoryStyle(category) {
    if (category === 'Repairs') return { bg: 'var(--color-danger-light)', color: 'var(--color-danger-strong)' };
    if (category === 'Cleaning') return { bg: 'var(--color-info-light)', color: 'var(--color-info-strong)' };
    if (category === 'Utilities') return { bg: 'var(--color-warning-soft)', color: 'var(--color-warning)' };
    if (category === 'Security') return { bg: 'var(--color-accent-purple-light)', color: 'var(--color-accent-purple)' };
    return { bg: 'var(--color-bg-alt)', color: 'var(--color-ink-soft)' };
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
      const res = await fetch(`${API_BASE}/api/expenses`, {
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
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
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
    { key: 'agents', label: 'Agents', icon: '🧑‍💼' },
    { key: 'reset-requests', label: 'Password Resets', icon: '🔑' },
    { key: 'payments', label: 'Payments', icon: '💰' },
    { key: 'invoices', label: 'Invoices', icon: '📋' },
    { key: 'expenses', label: 'Expenses', icon: '🧾' },
    { key: 'messages', label: 'Messages', icon: '💬' },
    { key: 'water', label: 'Water Bills', icon: '💧' },
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
        <p style={{ color: 'var(--color-danger-strong)' }}>⚠ {error}</p>
      </div>
    );

  function handleTemplateSelect(template) {
    setMessageTemplate(template);
    setMessageText(messageTemplates[template]);
  }

  async function sendOneMessage(phone) {
    const res = await fetch(`${API_BASE}/api/messages/send`, {
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
  

  async function handleSaveWaterBill(unit, amount) {
    if (!amount || parseInt(amount) < 1) {
      alert('please enter a valid amount');
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
        body: JSON.stringify({ unit_id: unit.unit_id, amount: parseInt(amount), month: period.month, year: period.year }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Could not save water bill.');
        return;
      }
      await loadUnits();
      await loadWaterBills();
      setNewWaterAmounts((prev) => ({ ...prev, [unit.unit_id]: '' }));
      alert(`House ${unit.unit_number} water bill updated to Ksh ${parseInt(amount).toLocaleString()}!`);
    } catch (err) {
      alert('Could not reach the server.');
    }
  }

  function DashboardContent() {
    return (
      <div>
        <div style={styles.summaryRow}>
          {[
            { value: totalUnits, label: 'Total Units', color: 'var(--color-brand)' },
            { value: occupiedUnits, label: 'Occupied', color: 'var(--color-brand)' },
            { value: availableUnits, label: 'Available', color: 'var(--color-brand)' },
            { value: pendingCount, label: 'Pending', color: 'var(--color-warning)' },
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
              style={{ ...styles.actionBtn, backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-strong)' }}
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
                    <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>{tenant.created_at}</p>
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
                  {newUnitHasWater && (
                    <div style={styles.editField}>
                      <p style={styles.editLabel}>Water Bill (Ksh)</p>
                      <input
                        type="number"
                        value={newUnitWaterAmount}
                        onChange={(e) => setNewUnitWaterAmount(e.target.value)}
                        placeholder="e.g. 1200"
                        style={styles.editInput}
                      />
                    </div>
                  )}
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Paybill No</p>
                    <input
                      value={newUnitPaybill}
                      onChange={(e) => setNewUnitPaybill(e.target.value)}
                      placeholder="Leave blank to use the property's default"
                      style={styles.editInput}
                    />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Account No</p>
                    <input
                      value={newUnitAccount}
                      onChange={(e) => setNewUnitAccount(e.target.value)}
                      placeholder="Leave blank to use the property's default"
                      style={styles.editInput}
                    />
                  </div>
                  <button onClick={handleAddUnit} style={styles.saveBtn}>+ Add Unit</button>
                </div>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Bulk Assign Paybill / Account</p>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '-12px 0 20px' }}>
                  Set a paybill and/or account number on many units at once — pick "Select All" if
                  every unit shares one paybill, or check off just the ones that should share a
                  different one from the rest.
                </p>
                <div style={styles.editRow}>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Paybill No</p>
                    <input value={bulkPaybill} onChange={(e) => setBulkPaybill(e.target.value)} placeholder="e.g. 4567" style={styles.editInput} />
                  </div>
                  <div style={styles.editField}>
                    <p style={styles.editLabel}>Account No</p>
                    <input value={bulkAccount} onChange={(e) => setBulkAccount(e.target.value)} placeholder="e.g. 9876543210" style={styles.editInput} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 10px' }}>
                  <input
                    type="checkbox"
                    id="bulk-select-all"
                    checked={units.length > 0 && bulkSelectedUnits.length === units.length}
                    onChange={toggleBulkSelectAll}
                  />
                  <label htmlFor="bulk-select-all" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', cursor: 'pointer' }}>
                    Select All ({bulkSelectedUnits.length} of {units.length} selected)
                  </label>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  {units.map((u) => (
                    <label
                      key={u.unit_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--color-border)',
                        backgroundColor: bulkSelectedUnits.includes(u.unit_id) ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelectedUnits.includes(u.unit_id)}
                        onChange={() => toggleBulkUnit(u.unit_id)}
                      />
                      House {u.unit_number}
                    </label>
                  ))}
                </div>

                <button onClick={handleBulkAssignPaybill} disabled={bulkApplying} style={styles.saveBtn}>
                  {bulkApplying ? 'Applying...' : `Apply to ${bulkSelectedUnits.length} Unit(s)`}
                </button>
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
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Paybill No</p>
                              <input
                                value={editingUnitPaybill}
                                onChange={(e) => setEditingUnitPaybill(e.target.value)}
                                placeholder="Property default"
                                style={styles.editInput}
                              />
                            </div>
                            <div style={styles.editField}>
                              <p style={styles.editLabel}>Account No</p>
                              <input
                                value={editingUnitAccount}
                                onChange={(e) => setEditingUnitAccount(e.target.value)}
                                placeholder="Property default"
                                style={styles.editInput}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={styles.unitRent}>
                              Ksh {unit.rent_amount.toLocaleString()}
                            </p>
                            {unit.has_water_bill ? (
                              <p style={styles.unitWater}>💧 Water: Ksh {unit.water_bill.toLocaleString()}</p>
                            ) : null}
                            {(unit.paybill_no || unit.account_no) ? (
                              <p style={styles.unitWater}>
                                💳 Paybill {unit.paybill_no || '—'} / Acc {unit.account_no || '—'}
                              </p>
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
                    <React.Fragment key={tenant.user_id}>
                    <div style={styles.tenantRow}>
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
                            <p style={styles.tenantDetails}>
                              Agreement: {tenant.agreement_signed ? '✓ Signed' : '— Not signed'}
                              {' · '}
                              Deposit: {tenant.deposit_paid
                                ? `✓ Ksh ${tenant.deposit_amount_paid?.toLocaleString()} paid`
                                : `— Pending (Ksh ${(tenant.unit_deposit_amount ?? 0).toLocaleString()} expected)`}
                            </p>
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
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleEditTenant(tenant)} style={styles.editBtn}>Edit</button>
                            {!tenant.deposit_paid ? (
                              <button onClick={() => handleMarkDeposit(tenant)} style={styles.saveBtn}>
                                Mark Deposit Paid
                              </button>
                            ) : (
                              <button onClick={() => handleDownloadDepositReceipt(tenant.user_id)} style={styles.editBtn}>
                                📄 Deposit Receipt
                              </button>
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
                        )}
                      </div>
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
                    <React.Fragment key={tenant.user_id}>
                    <div style={styles.tenantRow}>
                      <div style={{ ...styles.unitBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-muted)' }}>—</div>
                      <div style={styles.tenantInfo}>
                        <p style={{ ...styles.tenantName, color: 'var(--color-muted)' }}>{tenant.full_name}</p>
                        <p style={styles.tenantDetails}>@{tenant.username} · {tenant.phone}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ ...styles.statusBadge, backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-muted)' }}>VACATED</span>
                        <button onClick={() => handleViewDeductions(tenant)} style={styles.editBtn}>
                          {viewingDeductionsFor === tenant.user_id ? 'Hide Deductions' : 'View Deductions'}
                        </button>
                        <button onClick={() => handleDownloadVacateReceipt(tenant.user_id)} style={styles.editBtn}>
                          📄 Vacate Receipt
                        </button>
                        <button onClick={() => handleUnvacate(tenant)} style={styles.saveBtn}>
                          Undo Vacate
                        </button>
                      </div>
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

          {/* AGENTS */}
          {activePage === 'agents' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Pending Agents ({pendingAgents.length})</p>
                {pendingAgents.length === 0 ? (
                  <p style={styles.placeholderText}>No pending agent applications.</p>
                ) : (
                  pendingAgents.map((agent) => (
                    <div key={agent.user_id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>🧑‍💼</div>
                      <div style={styles.tenantInfo}>
                        <p style={styles.tenantName}>{agent.full_name}</p>
                        <p style={styles.tenantDetails}>@{agent.username} · {agent.phone}</p>
                        <p style={styles.tenantPenalty}>
                          Requested property: {agent.property_name || '—'}
                        </p>
                      </div>
                      <div style={styles.tenantActions}>
                        <button onClick={() => handleApproveAgent(agent.user_id)} style={styles.approveBtn}>Approve</button>
                        <button onClick={() => handleRejectAgent(agent.user_id)} style={styles.rejectBtn}>Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Active Agents ({agents.length})</p>
                {agents.length === 0 ? (
                  <p style={styles.placeholderText}>No agents yet.</p>
                ) : (
                  agents.map((agent) => (
                    <div key={agent.user_id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>🧑‍💼</div>
                      <div style={styles.tenantInfo}>
                        <p style={styles.tenantName}>{agent.full_name}</p>
                        <p style={styles.tenantDetails}>@{agent.username} · {agent.phone}</p>
                        <p style={styles.tenantPenalty}>
                          Property: {agent.property_name || '—'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PASSWORD RESET REQUESTS */}
          {activePage === 'reset-requests' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Password Reset Requests ({passwordResetRequests.length})</p>
                {passwordResetRequests.length === 0 ? (
                  <p style={styles.placeholderText}>No pending password reset requests.</p>
                ) : (
                  passwordResetRequests.map((req) => (
                    <div key={req.user_id} style={styles.tenantRow}>
                      <div style={styles.unitBadge}>🔑</div>
                      <div style={styles.tenantInfo}>
                        <p style={styles.tenantName}>{req.full_name}</p>
                        <p style={styles.tenantDetails}>@{req.username} · {req.phone} · {req.role}</p>
                        <p style={{ fontSize: '11px', color: 'var(--color-muted)', margin: 0 }}>
                          Requested {req.password_reset_requested_at}
                        </p>
                      </div>
                      <div style={styles.tenantActions}>
                        <button onClick={() => handleApprovePasswordReset(req.user_id)} style={styles.approveBtn}>
                          Reset Password
                        </button>
                        <button onClick={() => handleDismissPasswordReset(req.user_id)} style={styles.rejectBtn}>
                          Dismiss
                        </button>
                      </div>
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
                  <p style={{ ...styles.summaryValue, color: 'var(--color-brand)' }}>Ksh {totalCollected.toLocaleString()}</p>
                  <p style={styles.summaryLabel}>Total Collected</p>
                </div>
                <div style={styles.summaryCard}>
                  <p style={{ ...styles.summaryValue, color: 'var(--color-danger-strong)' }}>Ksh {totalOutstanding.toLocaleString()}</p>
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
                <p style={styles.cardTitle}>Record Manual Payment</p>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '-12px 0 20px' }}>
                  For cash, bank transfer, phone-based M-Pesa (Houses 7–9), or corrections that
                  won't come through the paybill automatically.
                </p>
                <div style={styles.expenseFormRow}>
                  <div style={{ ...styles.filterGroup, flex: 1 }}>
                    <p style={styles.filterLabel}>Unit</p>
                    <select
                      value={manualUnitId}
                      onChange={(e) => setManualUnitId(e.target.value)}
                      style={{ ...styles.filterSelect, width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="">Select a unit...</option>
                      {units.map((u) => (
                        <option key={u.unit_id} value={u.unit_id}>
                          House {u.unit_number}{u.has_water_bill ? ' 💧' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Amount (Ksh)</p>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="e.g. 18000"
                      style={styles.filterSelect}
                      min="1"
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Phone Used</p>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="0712345678"
                      style={styles.filterSelect}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>M-Pesa Code (optional)</p>
                    <input
                      type="text"
                      value={manualMpesaCode}
                      onChange={(e) => setManualMpesaCode(e.target.value)}
                      placeholder="e.g. QGH7X..."
                      style={styles.filterSelect}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Payment Date</p>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      style={styles.filterSelect}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>Month</p>
                    <input
                      type="text"
                      value={manualMonth}
                      onChange={(e) => setManualMonth(e.target.value)}
                      placeholder="e.g. August 2026"
                      style={styles.filterSelect}
                    />
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>&nbsp;</p>
                    <button onClick={handleRecordManualPayment} disabled={submittingManual} style={styles.addExpenseBtn}>
                      {submittingManual ? 'Recording...' : '+ Record Payment'}
                    </button>
                  </div>
                </div>
                {manualError !== '' && (
                  <p style={{ color: 'var(--color-danger-strong)', fontSize: '13px', margin: '12px 0 0' }}>{manualError}</p>
                )}
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
                            backgroundColor: payment.status === 'paid' ? 'var(--color-primary-light)' : 'var(--color-danger-light)',
                            color: payment.status === 'paid' ? 'var(--color-brand)' : 'var(--color-danger-strong)',
                          }}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      {payment.status === 'paid' && (
                        <button
                          onClick={() => handleDownloadReceipt(payment.payment_id)}
                          style={styles.addExpenseBtn}
                        >
                          📄 Receipt
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* INVOICES */}
          {activePage === 'invoices' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Generate Invoice</p>
                <div style={styles.filterRow}>
                  <div style={{ ...styles.filterGroup, flex: 1 }}>
                    <p style={styles.filterLabel}>Tenant / Unit</p>
                    <select
                      value={invoiceUnitId}
                      onChange={(e) => setInvoiceUnitId(e.target.value)}
                      style={{ ...styles.filterSelect, width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="">Select a tenant...</option>
                      {tenants.filter((t) => t.status === 'active').map((t) => (
                        <option key={t.user_id} value={t.unit_id}>
                          {t.full_name} - House {units.find((u) => u.unit_id === t.unit_id)?.unit_number ?? t.unit_id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.filterGroup}>
                    <p style={styles.filterLabel}>&nbsp;</p>
                    <button onClick={handleGenerateInvoice} disabled={generatingInvoice} style={styles.addExpenseBtn}>
                      {generatingInvoice ? 'Generating...' : '+ Generate'}
                    </button>
                  </div>
                </div>
                {invoiceError !== '' && (
                  <p style={{ color: 'var(--color-danger-strong)', fontSize: '13px', margin: '12px 0 0' }}>{invoiceError}</p>
                )}
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Monthly Auto-Generation</p>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '0 0 16px' }}>
                  Every active tenant automatically gets this month's invoice generated once a day if they don't already
                  have one. Use this button to run that check right now instead of waiting for the next scheduled pass.
                </p>
                <button onClick={handleGenerateMonthlyInvoices} disabled={generatingInvoice} style={styles.addExpenseBtn}>
                  {generatingInvoice ? 'Running...' : '⚡ Run Monthly Generation Now'}
                </button>
              </div>

              <div style={styles.card}>
                <p style={styles.cardTitle}>Invoice Records ({invoices.length})</p>
                {invoices.length === 0 ? (
                  <p style={styles.placeholderText}>No invoices generated yet.</p>
                ) : (
                  invoices.map((invoice) => {
                    const statusColors = {
                      paid: { bg: 'var(--color-primary-light)', color: 'var(--color-brand)' },
                      partial: { bg: 'var(--color-warning-soft)', color: 'var(--color-warning)' },
                      unpaid: { bg: 'var(--color-danger-light)', color: 'var(--color-danger-strong)' },
                    };
                    const statusStyle = statusColors[invoice.status] || statusColors.unpaid;
                    return (
                      <div key={invoice.invoice_id} style={styles.paymentRowFull}>
                        <div style={styles.unitBadge}>H{invoice.unit_number}</div>
                        <div style={styles.paymentInfo}>
                          <p style={styles.paymentTenant}>{invoice.invoice_no} · {invoice.tenant_name}</p>
                          <p style={styles.paymentDate}>
                            {invoice.month} · Due {invoice.due_date}
                            {invoice.water_amount > 0 ? ` · Water Ksh ${invoice.water_amount.toLocaleString()}` : ''}
                            {invoice.penalty > 0 ? ` · Penalty Ksh ${invoice.penalty.toLocaleString()}` : ''}
                            {invoice.status === 'partial' ? ` · Paid Ksh ${invoice.amount_paid.toLocaleString()} of ${invoice.total_amount.toLocaleString()}` : ''}
                          </p>
                        </div>
                        <div style={styles.paymentRight}>
                          <p style={styles.paymentAmount}>
                            {invoice.status === 'partial'
                              ? `Ksh ${invoice.balance_due.toLocaleString()} due`
                              : `Ksh ${invoice.total_amount.toLocaleString()}`}
                          </p>
                          <span
                            style={{
                              ...styles.paymentStatusBadge,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                        </div>
                        {invoice.amount_paid > 0 ? (
                          <button onClick={() => handleDownloadInvoiceReceipt(invoice.invoice_id)} style={styles.editBtn}>
                            📄 Receipt
                          </button>
                        ) : (
                          <button onClick={() => handleDeleteInvoice(invoice.invoice_id)} style={styles.deleteBtn}>
                            Delete
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* EXPENSES */}
          {activePage === 'expenses' && (
            <div>
              <div style={styles.card}>
                <p style={styles.cardTitle}>Total Expenses This Month</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-danger-strong)', margin: '0 0 20px' }}>
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
                <p style={styles.cardTitle}>Send WhatsApp Message</p>
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
                        backgroundColor: messageTemplate === t.key ? 'var(--color-brand)' : 'var(--color-bg-alt)',
                        color: messageTemplate === t.key ? 'var(--color-text-on-brand)' : 'var(--color-ink-soft)',
                        border: messageTemplate === t.key ? 'none' : '1px solid var(--color-border-soft)',
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
                    color: messageText.length > 4096 ? 'var(--color-danger-strong)' : 'var(--color-muted)',
                    fontWeight: messageText.length > 4096 ? 700 : 400,
                  }}>
                    {messageText.length}/4096{messageText.length > 4096 && ' — Over WhatsApp limit!'}
                  </p>
                </div>

                <button onClick={handleSendMessage} style={styles.sendBtn}>Send WhatsApp Message</button>
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
                <p style={styles.cardTitle}>Set Water Bills</p>
                {waterUnits.length === 0 ? (
                  <p style={styles.placeholderText}>
                    No units have water billing enabled yet. Turn it on for a unit from the Units tab.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: '0 0 20px' }}>
                      Set the water bill for each unit below before tenants pay this month.
                    </p>
                    <div style={styles.waterCardsRow}>
                      {waterUnits.map((unit) => {
                        const occupant = tenants.find((t) => t.unit_id === unit.unit_id && t.status === 'active');
                        const period = nextPeriods[unit.unit_id];
                        return (
                          <div key={unit.unit_id} style={styles.waterCard}>
                            <div style={styles.waterCardHeader}>
                              <div style={styles.unitBadge}>H{unit.unit_number}</div>
                              <div>
                                <p style={styles.waterTenantName}>{occupant?.full_name || 'No tenant'}</p>
                                <p style={styles.waterCurrentBill}>
                                  Current: Ksh {(unit.water_bill || 0).toLocaleString()}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--color-warning)', margin: '4px 0 0', fontWeight: 600 }}>
                                  Billing for: {period ? `${period.month} ${period.year}` : '...'}
                                </p>
                              </div>
                            </div>
                            <div style={styles.waterInputRow}>
                              <input
                                type='number'
                                value={newWaterAmounts[unit.unit_id] || ''}
                                onChange={(e) => setNewWaterAmounts((prev) => ({ ...prev, [unit.unit_id]: e.target.value }))}
                                placeholder='newAmount'
                                style={styles.waterInput}
                                min='2'
                              />
                              <button onClick={() => handleSaveWaterBill(unit, newWaterAmounts[unit.unit_id])} style={styles.waterSaveBtn}>Save</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {waterUnits.length > 0 && (
                <div style={styles.card}>
                  <p style={styles.cardTitle}>Water Bill History</p>
                  {waterHistory.length === 0 ? (
                    <p style={styles.placeholderText}>No water bill history yet.</p>
                  ) : (
                    <>
                      <div style={styles.waterTableHeader}>
                        <p style={{ ...styles.waterTableCell, fontWeight: 700 }}>Month</p>
                        {waterUnits.map((unit) => (
                          <p key={unit.unit_id} style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>
                            House {unit.unit_number}
                          </p>
                        ))}
                        <p style={{ ...styles.waterTableCell, fontWeight: 700, textAlign: 'right' }}>Total</p>
                      </div>
                      {waterHistory.map((record) => {
                        const total = waterUnits.reduce((sum, u) => sum + (record.amounts[u.unit_id] || 0), 0);
                        return (
                          <div key={record.id} style={styles.waterTableRow}>
                            <p style={styles.waterTableCell}>{record.month}</p>
                            {waterUnits.map((unit) => (
                              <p key={unit.unit_id} style={{ ...styles.waterTableCell, textAlign: 'right', color: 'var(--color-ink-soft)' }}>
                                Ksh {(record.amounts[unit.unit_id] || 0).toLocaleString()}
                              </p>
                            ))}
                            <p style={{ ...styles.waterTableCell, textAlign: 'right', color: 'var(--color-ink-soft)' }}>
                              Ksh {total.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const GREEN = 'var(--color-brand)';
const DARK_GREEN = 'var(--color-brand-dark)';

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
    color: 'var(--color-text-on-brand)',
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
    color: 'var(--color-text-on-brand)',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  badge: {
    backgroundColor: 'var(--color-warning)',
    color: 'var(--color-text-on-brand)',
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
    color: 'var(--color-text-on-brand)',
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
    background: 'var(--color-surface)',
    borderRadius: '16px',
    padding: '24px 20px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  summaryValue: {
    fontSize: '32px',
    fontWeight: 700,
    margin: '0 0 6px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: '16px',
    marginBottom: '24px',
    padding: '28px',
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
  actionsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actionBtn: {
    padding: '12px 20px',
    backgroundColor: 'var(--color-primary-light)',
    color: GREEN,
    border: '1px solid var(--color-success-soft)',
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
    borderBottom: '1px solid var(--color-border-soft)',
  },
  paymentTenant: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: 'var(--color-ink)',
  },
  paymentDate: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: 0,
  },
  paymentAmount: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: 'var(--color-ink)',
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
    borderBottom: '1px solid var(--color-border-soft)',
    gap: '12px',
  },
  pendingName: {
    fontSize: '15px',
    fontWeight: 600,
    margin: '0 0 4px',
    color: 'var(--color-ink)',
  },
  pendingDetails: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: '0 0 2px',
  },
  approveBtn: {
    padding: '10px 18px',
    backgroundColor: GREEN,
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--color-danger-strong)',
    color: 'var(--color-text-on-brand)',
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
    borderBottom: '1px solid var(--color-border-soft)',
    flexWrap: 'wrap',
  },
  unitBadge: {
    width: '44px',
    height: '44px',
    minWidth: '44px',
    borderRadius: '12px',
    backgroundColor: 'var(--color-primary-light)',
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
    color: 'var(--color-ink)',
  },
  unitRent: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: 0,
  },
  unitWater: {
    fontSize: '13px',
    color: 'var(--color-info-strong)',
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
    border: '1px solid var(--color-border-soft)',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
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
    color: 'var(--color-muted)',
    margin: 0,
    fontWeight: 500,
  },
  editInput: {
    width: '120px',
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
  tenantRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--color-border-soft)',
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
    color: 'var(--color-ink)',
  },
  tenantDetails: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: '0 0 4px',
  },
  tenantPenalty: {
    fontSize: '12px',
    color: 'var(--color-warning)',
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
    margin: '4px 0 16px',
  },
  vacateSummaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  vacateSummaryValue: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--color-ink)',
    margin: '4px 0 0',
  },
  vacateNote: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    margin: '0 0 12px',
    lineHeight: 1.5,
  },
  deductionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  photoRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  photoInput: {
    fontSize: '12px',
    maxWidth: '200px',
  },
  evidenceThumb: {
    width: '90px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid var(--color-border-soft)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  placeholderText: {
    color: 'var(--color-muted)',
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
    color: 'var(--color-muted)',
    margin: 0,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1.5px solid var(--color-border-soft)',
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
    cursor: 'pointer',
    minWidth: '160px',
  },
  filterCount: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-brand)',
    margin: 0,
    padding: '10px 0',
  },
  paymentRowFull: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--color-border-soft)',
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
    backgroundColor: 'var(--color-brand)',
    color: 'var(--color-text-on-brand)',
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
    borderBottom: '1px solid var(--color-border-soft)',
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
    color: 'var(--color-ink)',
  },
  expenseDate: {
    fontSize: '13px',
    color: 'var(--color-muted)',
    margin: 0,
  },
  expenseAmount: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--color-danger-strong)',
    margin: 0,
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
    border: '1.5px solid var(--color-border-soft)',
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.5,
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
  },
  sendBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--color-brand)',
    color: 'var(--color-text-on-brand)',
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
    borderBottom: '1px solid var(--color-border-soft)',
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
    color: 'var(--color-ink)',
    margin: 0,
  },
  messageDate: {
    fontSize: '12px',
    color: 'var(--color-muted)',
    margin: 0,
  },
  messageContent: {
    fontSize: '13px',
    color: 'var(--color-ink-soft)',
    margin: 0,
    lineHeight: 1.5,
  },
  messageSentBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--color-brand)',
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
    backgroundColor: 'var(--color-surface-alt)',
    borderRadius: '14px',
    padding: '20px',
    border: '1px solid var(--color-info-light)',
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
    color: 'var(--color-ink)',
  },
  waterCurrentBill: {
    fontSize: '13px',
    color: 'var(--color-info-strong)',
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
    border: '1.5px solid var(--color-border-soft)',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-ink)',
  },
  waterSaveBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--color-brand)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveMonthBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--color-info-strong)',
    color: 'var(--color-text-on-brand)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  waterTableHeader: {
    display: 'flex',
    padding: '10px 0',
    borderBottom: '2px solid var(--color-border-soft)',
    marginBottom: '4px',
  },
  waterTableRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border-soft)',
    alignItems: 'center',
  },
  waterTableCell: {
    flex: 1,
    fontSize: '14px',
    color: 'var(--color-ink-soft)',
    margin: 0,
  },
};

export default AdminDashboard;