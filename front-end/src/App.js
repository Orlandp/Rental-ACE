import React from 'react';
import PayPage from './pages/PayPage';
import LoginPage from './pages/LoginPage';
import TenantDashboard from './pages/tenant/Dashboard';

function App() {
  const path = window.location.pathname;

  if (path === '/' || path === '/pay') return <PayPage />;
  if (path === '/login') return <LoginPage />;

  if (path === '/tenant/dashboard') return <TenantDashboard />;
  if (path === '/admin/dashboard')
    return <div style={styles.placeholder}><h2>⚙️ Admin Dashboard — Day 7!</h2></div>;

  if (path === '/landlord/dashboard')
    return <div style={styles.placeholder}><h2>🏗️ Landlord Dashboard — Day 11!</h2></div>;

  return (
    <div style={styles.placeholder}>
      <h2>Page not found</h2>
      <a href="/pay?property=1" style={styles.link}>→ Payment Page</a>
    </div>
  );
}

const styles = {
  placeholder: {
    padding: '60px 40px',
    textAlign: 'center',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  link: {
    color: '#1a7a4a',
    fontSize: '15px',
    fontWeight: 600,
    textDecoration: 'none',
  },
};

export default App;