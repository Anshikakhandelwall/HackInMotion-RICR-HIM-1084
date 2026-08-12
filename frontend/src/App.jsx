import React, { useState } from 'react';
import Signup from './pages/Signup/Signup';

function App() {
  const [currentView, setCurrentView] = useState('signup');

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    setCurrentView('signup');
  };

  return (
    <div className="app-root">
      {currentView === 'signup' ? (
        <Signup
          onNavigateToLogin={handleNavigateToLogin}
          onSuccess={(userData) => {
            console.log('Registration success:', userData);
          }}
        />
      ) : (
        /* Partner's Login Placeholder Container (Light Theme) */
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#756866', backgroundColor: '#FFFDFC', minHeight: '100vh' }}>
          <h2>Login Page</h2>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Login component reserved for partner implementation.
          </p>
          <button
            onClick={handleNavigateToSignup}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: '1px solid #E8D6D2',
              background: '#FFFFFF',
              color: '#A6534B',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Back to Register Page
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
