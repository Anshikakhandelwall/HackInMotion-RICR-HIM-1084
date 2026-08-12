import React, { useState, useEffect } from 'react';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/Login';
import HealthProfilePage from './pages/HealthProfile/HealthProfilePage';
import { getCurrentUser, isProfileCompleted, logoutUser } from './services/auth/authService';

function App() {
  // Determine initial view based on current authentication & onboarding completion state
  const getInitialView = () => {
    const user = getCurrentUser();
    if (user) {
      if (isProfileCompleted()) {
        return 'dashboard';
      }
      return 'onboarding';
    }
    return 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  // Keep state in sync with local user session
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [currentView]);

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    setCurrentView('signup');
  };

  // Called after account registration -> navigates directly to Login page (DO NOT show Health Profile during registration)
  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  // Called after successful LOGIN -> makes onboarding navigation decision
  const handleLoginSuccess = (data) => {
    const user = (data && data.user) || getCurrentUser();
    setCurrentUser(user);

    // Check if user has already completed the health profile
    if (isProfileCompleted()) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('onboarding');
    }
  };

  // Called after user confirms and saves the Health Profile onboarding form
  const handleOnboardingSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    setCurrentView('dashboard');
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentView('login');
  };

  return (
    <div className="app-root">
      {currentView === 'signup' && (
        <Signup
          onNavigateToLogin={handleNavigateToLogin}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {currentView === 'login' && (
        <Login
          onNavigateToSignup={handleNavigateToSignup}
          onSuccess={handleLoginSuccess}
        />
      )}

      {currentView === 'onboarding' && (
        <HealthProfilePage onSuccess={handleOnboardingSuccess} />
      )}

      {currentView === 'dashboard' && (
        /* Dashboard Container */
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#2B2524', backgroundColor: '#FFFDFC', minHeight: '100vh' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', background: '#FFFFFF', padding: '2rem', borderRadius: '16px', border: '1px solid #E8D6D2', boxShadow: '0 12px 32px -8px rgba(166, 83, 75, 0.08)' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2B2524', marginBottom: '0.5rem' }}>
              Welcome to MediGuard Dashboard
            </h1>
            <p style={{ color: '#756866', marginBottom: '1.5rem' }}>
              Hello, <strong>{currentUser?.fullName || currentUser?.email || 'User'}</strong>! Your health profile is complete.
            </p>

            {/* Display Saved Onboarding Profile Data */}
            {currentUser && (currentUser.age || currentUser.medicalConditions) && (
              <div style={{ textAlign: 'left', background: '#FFF8F7', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #F5EAE8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <p style={{ margin: '0.3rem 0' }}><strong>Age:</strong> {currentUser.age}</p>
                <p style={{ margin: '0.3rem 0' }}><strong>Medical History:</strong> {currentUser.medicalConditions}</p>
                {currentUser.regularMedicines && currentUser.regularMedicines.length > 0 && (
                  <p style={{ margin: '0.3rem 0' }}>
                    <strong>Regular Medicines:</strong> {currentUser.regularMedicines.join(', ')}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#A6534B',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
