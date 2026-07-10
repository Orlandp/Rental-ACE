import React, { useState, useEffect} from 'react';

function SuccessPage() {

     const params = new URLSearchParams(window.location.search);
     const house = params.get('house') || '';
     const property = params.get('property') || '1';
     const amount = params.get('amount') || '';
     const mpesaCode = params.get('code') || 'pending confirmation';
     
     const [countdown, setCountdown] = useState(10);

     useEffect (() => { 
        const timer = setInterval(()=> {
            setCountdown ((prev) => {
                if (prev <= 1){
                    clearInterval(timer);
                    window.location.href = '/pay?property=' + property;
                    return 0;
                }
                return prev -1;
            });
     },1000);
     return () => clearInterval(timer);
     }, [property]);

     return (
        <div style={styles.card}>
            <div style={styles.page}>
                <div style={styles.iconCircle}>✓</div>
                <h2 style={styles.title}>payment confirmed</h2>
                <p style={styles.subtitle}>
                    Your payment has been confirmed
                </p>
                <div style={styles.detailCard}>
                    {house && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>House</p>
                            <p style={styles.detailValue}>House{house}</p> 
                        </div>
                    )}
                    {amount && (
                        <div style={styles.detailRow}>
                            <p style={styles.detailLabel}>Amount Paid</p>
                            <p style={styles.detailValue}>
                                ksh{parseInt(amount).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <div style={styles.detailRow}>
                        <p style={styles.detailLabel}>Mpesa code</p>
                        <p style={{...styles.detailValue, fontSize:'12px', fontWeight: 700, margin: 0, color: '#267'}}>
                          {mpesaCode}
                        </p>
                    </div>
                    <div style={styles.detailRow}>
                        <p style={styles.detailLabel}>Status</p>
                        <p style={{...styles.detailValue, color:'#1a4afa'}}>
                            Confirmed,Received
                        </p>
                    </div>
                </div>
                <div style={styles.messages}>
                    An sms confirmation will be send through your phone.
                </div>
                <button 
                  onClick={() => window.location.href = '/pay?property' + property}
                  style={styles.backBtn}
                >
                    Make Another Payment
                </button>
                <button
                    onClick={() => window.location.href = '/login'}
                    style={styles.loginBtn}
                >
                    View Payment History.    
                </button>
                <p style={styles.countdown}>
                    redirecct in {countdown} seconds...
                </p>
            </div>
        </div>

     );

}

const styles = {
    page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
     textAlign: 'center',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#e8f5ee',
    color: '#1a7a4a',
    fontSize: '36px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 10px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#888',
    margin: '0 0 28px',
    lineHeight: 1.6,
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '20px',
    marginBottom: '20px',
    textAlign:'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
    fontWeight: 500,
  },
    detailValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: 0,
    fontWeight: 600,
  },
  messages: {
    backgroundColor: '#e8f5ee',
    border: '1px solid #b8dfc9',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#1a7a4a',
    marginBottom: '24px',
    fontWeight: 500,
  },
  backBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '12px',
  },
  loginBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'white',
    color: '#1a7a4a',
    border: '2px solid #1a7a4a',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '20px',
  },
  countdown: {
    fontSize: '13px',
    color: '#aaa',
    margin: 0,
  },
}; 
export default SuccessPage;