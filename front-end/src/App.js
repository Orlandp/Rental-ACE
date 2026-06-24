import React from 'react';
import PayPage from './pages/PayPage';
function App() {
  const path = window.location.pathname;

  if (path === '/' || path === '/pay') {
    return<PayPage/>;
        
  }

  if (path === '/admin') {
    return (
      <div>
        <h2>Admin Dashboard</h2>
        <p>Coming soon!</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Page not found</h2>
      <p>Go to /pay to test</p>
    </div>
  );
}

export default App;