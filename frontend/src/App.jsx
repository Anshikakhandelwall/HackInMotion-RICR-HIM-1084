import React, { useState } from 'react';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/Login';

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
            // TODO: Store auth token/user data
            // TODO: Redirect to dashboard or set authenticated state
          }}
        />
      ) : (
        <Login
          onNavigateToSignup={handleNavigateToSignup}
          onSuccess={(userData) => {
            console.log('Login success:', userData);
            // TODO: Store auth token/user data
            // TODO: Redirect to dashboard or set authenticated state
          }}
        />
      )}
    </div>
  );
}

export default App;
