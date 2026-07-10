import React, { useState, useEffect } from 'react';
import PayPage from './pages/PayPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TenantDashboard from './pages/tenant/Dashboard';
import LandlordDashboard from './pages/landlord/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import SuccessPage from './pages/SuccessPage';

function HomePage() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={homeStyles.page}>

      {/* Header */}
      <div style={homeStyles.header}>
        <div style={homeStyles.headerInner}>
          <div style={homeStyles.logoCircle}>🏠</div>
          <h1 style={homeStyles.title}>Ace Apartments</h1>
          <p style={homeStyles.subtitle}>
            Eldoret · Modern Property Management
          </p>
          <p style={homeStyles.description}>
            Pay rent, track payments and manage your property
            all in one place.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        ...homeStyles.cardsRow,
        flexDirection: isDesktop ? 'row' : 'column',
      }}>

        <div style={homeStyles.card}>
          <div style={homeStyles.cardIcon}>💳</div>
          <h3 style={homeStyles.cardTitle}>Pay Rent</h3>
          <p style={homeStyles.cardText}>
            Scan the QR code on your door or click below
            to pay your rent via M-Pesa instantly.
          </p>
          <a href="/pay?property=1" style={homeStyles.cardBtn}>
            Pay Now →
          </a>
        </div>

        <div style={homeStyles.card}>
          <div style={homeStyles.cardIcon}>🔐</div>
          <h3 style={homeStyles.cardTitle}>Login</h3>
          <p style={homeStyles.cardText}>
            Already have an account? Login to view your
            dashboard, payment history and balance.
          </p>
          <a href="/login" style={homeStyles.cardBtn}>
            Login →
          </a>
        </div>

        <div style={homeStyles.card}>
          <div style={homeStyles.cardIcon}>📝</div>
          <h3 style={homeStyles.cardTitle}>Register</h3>
          <p style={homeStyles.cardText}>
            New here? Create your account as a tenant,
            admin or landlord to get started.
          </p>
          <a href="/register" style={homeStyles.cardBtn}>
            Register →
          </a>
        </div>

      </div>

      {/* Features Row */}
      <div style={homeStyles.featuresRow}>
        {[
          { icon: '📱', text: 'M-Pesa STK Push' },
          { icon: '📊', text: 'Payment History'  },
          { icon: '💬', text: 'SMS Notifications'},
          { icon: '🔒', text: 'Secure & Private' },
        ].map((f) => (
          <div key={f.text} style={homeStyles.featureItem}>
            <span style={homeStyles.featureIcon}>{f.icon}</span>
            <span style={homeStyles.featureText}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={homeStyles.footer}>
        <p style={homeStyles.footerText}>
          © 2026 Ace Apartments · Eldoret · All rights reserved
        </p>
      </div>

    </div>
  );
}

function App() {
  const path = window.location.pathname;

  if (path === '/')                   return <HomePage />;
  if (path === '/pay')                return <PayPage />;
  if (path === '/success')            return <SuccessPage />;
  if (path === '/login')              return <LoginPage />;
  if (path === '/register')           return <RegisterPage />;
  if (path === '/tenant/dashboard')   return <TenantDashboard />;
  if (path === '/landlord/dashboard') return <LandlordDashboard />;
  if (path === '/admin/dashboard')    return <AdminDashboard />;

  return (
    <div style={notFoundStyles.page}>
      <div style={notFoundStyles.card}>
        <p style={notFoundStyles.icon}>🔍</p>
        <h2 style={notFoundStyles.title}>Page Not Found</h2>
        <p style={notFoundStyles.text}>
          The page you are looking for does not exist.
        </p>
        <a href="/" style={notFoundStyles.btn}>→ Go Home</a>
      </div>
    </div>
  );
}

const homeStyles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#1a7a4a',
    color: 'white',
    padding: '60px 24px 80px',
    textAlign: 'center',
  },
  headerInner: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  logoCircle: {
    fontSize: '56px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '40px',
    fontWeight: 700,
    margin: '0 0 10px',
  },
  subtitle: {
    fontSize: '16px',
    opacity: 0.85,
    margin: '0 0 16px',
  },
  description: {
    fontSize: '15px',
    opacity: 0.75,
    margin: 0,
    lineHeight: 1.6,
  },
  cardsRow: {
    display: 'flex',
    gap: '20px',
    padding: '40px 24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '-40px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '36px 28px',
    width: '280px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  cardIcon: {
    fontSize: '44px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '0 0 12px',
  },
  cardText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.7,
    margin: '0 0 28px',
    flex: 1,
  },
  cardBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 600,
    boxSizing: 'border-box',
  },
  featuresRow: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '24px',
    padding: '20px 24px 40px',
    backgroundColor: 'white',
    margin: '0 24px 24px',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureIcon: { fontSize: '20px' },
  featureText: { fontSize: '14px', color: '#555', fontWeight: 500 },
  footer: {
    textAlign: 'center',
    padding: '32px',
    marginTop: 'auto',
  },
  footerText: { fontSize: '13px', color: '#aaa', margin: 0 },
};

const notFoundStyles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '360px',
    width: '100%',
  },
  icon: { fontSize: '48px', margin: '0 0 16px' },
  title: { fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' },
  text: { fontSize: '14px', color: '#888', margin: '0 0 28px', lineHeight: 1.6 },
  btn: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#1a7a4a',
    color: 'white',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 600,
  },
};

export default App;