import React, { useState, useEffect } from 'react';
import AmountCard from '../components/AmountCard';
import TopBar from '../components/TopBar';

const mockProperties = {
    1: {
    property_id: 1,
    name: 'Ace Apartments',
    location: 'Eldoret',
    paybill: '123456',
    account_number: '423456',
    phone_number_house7: '07222234322',
    phone_number_house8: '07222234323',
    phone_number_house9: '07222234324',
    }
    };

    const mockUnits = {
      1: {
        unit_id: 1,
        property_id: 1,
        unit_number: 'House 1',
        rent_amount: '25000',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      1: {
        unit_id: 1,
        property_id: 1,
        unit_number: 'House 1',
        rent_amount: '25000',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      1: {
        unit_id: 1,
        property_id: 1,
        unit_number: 'House 1',
        rent_amount: '25000',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      1: {
        unit_id: 1,
        property_id: 1,
        unit_number: 'House 1',
        rent_amount: '25000',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      1: {
        unit_id: 1,
        property_id: 1,
        unit_number: 'House 1',
        rent_amount: '25000',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        phone_number: '07222234321',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      2: {
        unit_id: 2,
        property_id: 2,
        unit_number: 'House 2',
        rent_amount: '25000',
        phone_number: '07222234321',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      3: {
        unit_id: 3,
        property_id: 3,
        unit_number: 'House 3',
        rent_amount: '25000',
        phone_number: '07222234321',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      4: {
        unit_id: 4,
        property_id: 4,
        unit_number: 'House 4',
        rent_amount: '25000',
        phone_number: '07222234321',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      5: {
        unit_id: 5,
        property_id: 5,
        unit_number: 'House 5',
        rent_amount: '25000',
        phone_number: '07222234321',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      6: {
        unit_id: 6,
        property_id: 6,
        unit_number: 'House 6',
        rent_amount: '25000',
        phone_number: '07222234321',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'Paybill',
        house_type: 'two bedroom',
      },
      7: {
        unit_id: 7,
        property_id: 7,
        unit_number: 'House 7',
        rent_amount: '25000',
        phone_number: '07222234322',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'phone_number-house7',
        house_type: 'one bedroom',
      },
      8: {
        unit_id: 8,
        property_id: 8,
        unit_number: 'House 8',
        rent_amount: '25000',
        phone_number: '07222234323',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'phone_number-house8',
        house_type: 'One bedroom',
      },
      9: {
        unit_id: 9,
        property_id: 9,
        unit_number: 'House 9',
        rent_amount: '25000',
        phone_number: '07222234324',
        penalty_Date: '5th of every month',
        penalty_Rate: '5%',
        has_water_meter: false,
        payment_type: 'phone_number-house9',
        house_type: 'Bedsitter',
      },
    };

    function PayPage() {
      const [property, setProperty] = useState(null);
      const [selectedUnit, setSelectedUnit] = useState('');
      const [unitData, setUnitData] = useState('');
      const [tenantName, setTenantName] = useState('');
      const [phoneNumber, setPhoneNumber] = useState('');
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [formError, setFormError] = useState('');
      const [paying, setPaying] = useState(false);
      const [amount, setAmount] = useState('');
      const [phone, setPhone] = useState('');

    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get('property');

    useEffect(()=> {
      async function fetchLoadData() {
        if (!propertyId) {
          setError('Invalid property');
          setLoading(false);
          return;
        }
        try{
          const propertyData = mockProperties[propertyId];
          if(!propertyData) {
            setError('Property not found');
            setLoading(false);
            return;
          }
          setProperty(propertyData);
        } catch (err) {
          setError('Failed to load property data');
        } finally {
          setLoading(false);
        }
      }
      fetchLoadData();
    }, []);
    
    function handleUnitChange(e) {
      const selectedUnitId = e.target.value;
      setSelectedUnit(selectedUnitId);
      setUnitData(mockProperties[propertyId]?.[selectedUnitId] || 'null');
    }

    function handlePayment() {
      if (!selectedUnit) {
        setFormError('Please select a unit');
        return;
      }
      if (!tenantName.trim()) {
        setFormError('Please enter your full name');
        return;
      }
      if (!amount || isNaN(amount) || parseInt(amount) < 1) {
        setFormError('Please enter a valid amount');
        return;
      }
      const cleanPhone = phone.replace(/\s/g, '');
    const kenyanPhone = /^(07|01)\d{8}$/;
    if (!kenyanPhone.test(cleanPhone)) {
      setFormError('Please enter a valid Kenyan number e.g. 0712 345 678');
      return;
    }
    setFormError('');
    setPaying(true);
    setTimeout(() => {
      alert(
        `Payment Details:\n\n` +
        `Name:   ${tenantName}\n` +
        `House:  ${selectedUnit}\n` +
        `Amount: Ksh ${parseInt(amount).toLocaleString()}\n` +
        `Phone:  ${phone}\n\n` +
        `M-Pesa STK push coming in backend phase!`
      );
      setPaying(false);
    }, 1500);
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Loading...</p>
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

      <div style={styles.header}>
        <p style={styles.headerLabel}>Property</p>
        <h1 style={styles.headerName}>{property.name}</h1>
        <p style={styles.headerLocation}>{property.location}</p>
      </div>

      <div style={styles.card}>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Select Your House Number</p>
          <select
            value={selectedUnit}
            onChange={handleUnitChange}
             style={styles.select}
          >
            <option value="">-- Select House --</option>
            {[1,2,3,4,5,6,7,8,9].map((num) => (
              <option key={num} value={num}>
                House {num}
              </option>
            ))}
          </select>
        </div>

        {unitData && (
          <div style={styles.accountBadge}>
            ✓ Payment secured · {property.name}
          </div>
           )}

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Your Full Name</p>
          <input
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            placeholder="e.g. James Orlando"
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Amount to Pay (Ksh)</p>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 18000"
             style={styles.input}
            min="1"
          />
        </div>

        <div style={styles.fieldGroup}>
          <p style={styles.fieldLabel}>Your M-Pesa Number</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            maxLength={12}
            style={styles.input}
          />{formError !== '' && (
          <p style={styles.formError}>{formError}</p>
        )}

        <button
          onClick={handlePayment}
          disabled={paying}
          style={{ ...styles.payBtn, opacity: paying ? 0.7 : 1 }}
        >
          {paying ? 'Processing...' : 'Pay via M-Pesa'}
            </button>

        <div style={styles.loginLink}>
          <p style={styles.loginText}>Want to view your payment history?</p>
          <a href="/login" style={styles.loginAnchor}>
            Login to your account →
          </a>
        </div>

      </div>
         </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '420px',
    margin: '0 auto',
    backgroundColor: '#f4f6f8',
    minHeight: '100vh',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingText: { color: '#888', fontSize: '15px' },
  errorText: { color: '#c0392b', fontSize: '15px', padding: '20px', textAlign: 'center' },
  header: { 
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '32px 20px 40px',
    textAlign: 'center',
  },
  headerLabel: { fontSize: '11px', opacity: 0.8, margin: '0 0 6px', letterSpacing: '1px', textTransform: 'uppercase' },
  headerName: { fontSize: '28px', fontWeight: 600, margin: '0 0 6px' },
  headerLocation: { fontSize: '13px', opacity: 0.75, margin: 0 },
  card: {
    background: 'white',
    borderRadius: '16px',
    margin: '-20px 16px 24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '20px',
  },
  fieldGroup: { marginBottom: '16px' },
   fieldLabel: { fontSize: '13px', color: '#555', margin: '0 0 6px', fontWeight: 500 },
  select: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    color: '#1a1a1a',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    fontSize: '15px',
     boxSizing: 'border-box',
  },
  accountBadge: {
    background: '#e8f5ee',
    border: '1px solid #b8dfc9',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#1a7a4a',
    textAlign: 'center',
    marginBottom: '10px',
  },
  penaltyBadge: {
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '8px',
     padding: '10px 14px',
    fontSize: '12px',
    color: '#1a7a4a',
    textAlign: 'center',
    marginBottom: '10px',
  },
  penaltyBadge: {
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#f57c00',
    textAlign: 'center',
    marginBottom: '16px',
  },
   formError: { color: '#c0392b', fontSize: '12px', margin: '0 0 12px', textAlign: 'center' },
  payBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '20px',
  },
  loginLink: { textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #f0f0f0' },
  loginText: { fontSize: '13px', color: '#888', margin: '0 0 6px' },
  loginAnchor: { fontSize: '13px', color: '#1a7a4a', fontWeight: 600, textDecoration: 'none' },
};
export default PayPage;

