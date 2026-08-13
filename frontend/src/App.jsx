import React, { useState, useEffect } from 'react';
import Signup from './pages/Signup/Signup';
import Login from './pages/Login/Login';
import HealthProfilePage from './pages/HealthProfile/HealthProfilePage';
import Dashboard from './pages/Dashboard/Dashboard';
import Medicines from './pages/Medicines/Medicines';
import SafetyCheck from './pages/SafetyCheck/SafetyCheck';
import History from './pages/History/History';
import Profile from './pages/Profile/Profile';
import SettingsPage from './pages/Settings/SettingsPage';
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import { getCurrentUser, isProfileCompleted, logoutUser } from './services/auth/authService';

function App() {
  // Determine initial main view state
  const getInitialView = () => {
    const user = getCurrentUser();
    if (user) {
      const isDone = Boolean(user.profileCompleted || user.profile_completed || isProfileCompleted());
      if (isDone) {
        return 'dashboard_shell';
      }
      return 'onboarding';
    }
    return 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keep state synchronized with active user session
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [currentView, dashboardRoute]);

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    setCurrentView('signup');
  };

  // Called after account registration -> navigates to Login page
  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  // Called after successful LOGIN -> checks profile completion status
  const handleLoginSuccess = (data) => {
    const user = (data && data.user) || getCurrentUser();
    setCurrentUser(user);

    const isDone = Boolean(user && (user.profileCompleted || user.profile_completed));

    if (isDone) {
      setDashboardRoute('/dashboard');
      setCurrentView('dashboard_shell');
    } else {
      setCurrentView('onboarding');
    }
  };

  // Called after user confirms and saves the Health Profile onboarding form to backend DB
  const handleOnboardingSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    setDashboardRoute('/dashboard');
    setCurrentView('dashboard_shell');
  };

  // Internal dashboard sub-route navigation handler
  const handleDashboardNavigate = (routePath) => {
    setDashboardRoute(routePath);
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentView('login');
    setDashboardRoute('/dashboard');
  };

  return (
    <div className="app-root">
      {/* 1. Register View */}
      {currentView === 'signup' && (
        <Signup
          onNavigateToLogin={handleNavigateToLogin}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* 2. Login View */}
      {currentView === 'login' && (
        <Login
          onNavigateToSignup={handleNavigateToSignup}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* 3. First-Login Health Profile Onboarding View */}
      {currentView === 'onboarding' && (
        <HealthProfilePage onSuccess={handleOnboardingSuccess} />
      )}

      {/* 4. MediGuard Dashboard Application Shell */}
      {currentView === 'dashboard_shell' && (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#FFFDFC' }}>
          {/* Persistent Sidebar */}
          <Sidebar
            activeRoute={dashboardRoute}
            onNavigate={handleDashboardNavigate}
            onLogout={handleLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Content Layout Container */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Persistent Top Header */}
            <Header
              currentUser={currentUser}
              onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
            />

            {/* Main Sub-Page Views */}
            <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
              {dashboardRoute === '/dashboard' && (
                <Dashboard currentUser={currentUser} onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/medicines' && (
                <Medicines onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/safety-check' && (
                <SafetyCheck onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/history' && (
                <History onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/profile' && (
                <Profile currentUser={currentUser} />
              )}

              {dashboardRoute === '/settings' && (
                <SettingsPage />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
