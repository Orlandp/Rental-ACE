import React, { useState, useEffect } from 'react';
import PayPage from './pages/PayPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TenantDashboard from './pages/tenant/Dashboard';
import LandlordDashboard from './pages/landlord/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AgentDashboard from './pages/agent/Dashboard';
import SuccessPage from './pages/SuccessPage';
import ZoomControl from './components/ZoomControl';
import ThemeToggle from './components/ThemeToggle';

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
        <div style={homeStyles.headerGlow} />
        <div style={homeStyles.headerInner}>
          <div style={homeStyles.badge}>
            <span style={homeStyles.badgeDot} />
            Trusted by tenants across Eldoret
          </div>
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
            Click below to pay your rent via M-Pesa instantly.
          </p>
          <a href="/pay" style={homeStyles.cardBtn}>
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
          { icon: '💬', text: 'WhatsApp Notifications'},
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

  let page;
  if (path === '/')                   page = <HomePage />;
  else if (path === '/pay')                page = <PayPage />;
  else if (path === '/success')            page = <SuccessPage />;
  else if (path === '/login')              page = <LoginPage />;
  else if (path === '/register')           page = <RegisterPage />;
  else if (path === '/forgot-password')    page = <ForgotPasswordPage />;
  else if (path === '/tenant/dashboard')   page = <TenantDashboard />;
  else if (path === '/landlord/dashboard') page = <LandlordDashboard />;
  else if (path === '/admin/dashboard')    page = <AdminDashboard />;
  else if (path === '/agent/dashboard')    page = <AgentDashboard />;
  else page = (
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

  return (
    <>
      {page}
      <ZoomControl />
      <ThemeToggle />
    </>
  );
}

const homeStyles = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-alt)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)',
    color: 'var(--color-text-on-brand)',
    padding: '26px 24px 36px',
    textAlign: 'center',
  },
  headerGlow: {
    position: 'absolute',
    top: '-110px',
    right: '-100px',
    width: '240px',
    height: '240px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)',
    pointerEvents: 'none',
  },
  headerInner: {
    position: 'relative',
    maxWidth: '600px',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 16px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.22)',
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  badgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#5be89a',
  },
  logoCircle: {
    width: '42px',
    height: '42px',
    margin: '0 auto 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '13px',
    fontWeight: 500,
    opacity: 0.9,
    margin: '0 0 8px',
  },
  description: {
    fontSize: '13px',
    opacity: 0.78,
    margin: 0,
    lineHeight: 1.5,
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
    backgroundColor: 'var(--color-surface)',
    borderRadius: '20px',
    padding: '36px 28px',
    width: '280px',
    boxShadow: 'var(--shadow-md)',
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
    color: 'var(--color-ink)',
    margin: '0 0 12px',
  },
  cardText: {
    fontSize: '14px',
    color: 'var(--color-ink-soft)',
    lineHeight: 1.7,
    margin: '0 0 28px',
    flex: 1,
  },
  cardBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    backgroundColor: 'var(--color-brand)',
    color: 'var(--color-text-on-brand)',
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
    backgroundColor: 'var(--color-surface)',
    margin: '0 24px 24px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureIcon: { fontSize: '20px' },
  featureText: { fontSize: '14px', color: 'var(--color-ink-soft)', fontWeight: 500 },
  footer: {
    textAlign: 'center',
    padding: '32px',
    marginTop: 'auto',
  },
  footerText: { fontSize: '13px', color: 'var(--color-muted)', margin: 0 },
};

const notFoundStyles = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg-alt)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: '20px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-md)',
    maxWidth: '360px',
    width: '100%',
  },
  icon: { fontSize: '48px', margin: '0 0 16px' },
  title: { fontSize: '24px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-ink)' },
  text: { fontSize: '14px', color: 'var(--color-muted)', margin: '0 0 28px', lineHeight: 1.6 },
  btn: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: 'var(--color-brand)',
    color: 'var(--color-text-on-brand)',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 600,
  },
};

export default App;