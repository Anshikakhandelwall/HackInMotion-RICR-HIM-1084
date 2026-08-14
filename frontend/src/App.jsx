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
import InteractionDetails from './pages/SafetyCheck/InteractionDetails';
import useAuth from './hooks/useAuth';

function App() {
  const { user, loading, signOut } = useAuth();

  // 'loading'       — Supabase session check in progress; render nothing to avoid flash
  // 'login'         — unauthenticated public view
  // 'signup'        — unauthenticated public view
  // 'onboarding'    — authenticated, health profile not yet completed
  // 'dashboard_shell' — authenticated, full application shell
  const [currentView, setCurrentView] = useState('loading');
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  // Runs once Supabase has resolved the initial session.
  // Also re-runs whenever the user signs in or out (user changes).
  useEffect(() => {
    if (loading) return; // Wait for session check to complete — prevents login flash.

    if (user) {
      // Authenticated: only redirect to login/signup views back to the shell.
      // If the user is already inside the shell, leave dashboardRoute unchanged.
      setCurrentView((prev) => {
        if (prev === 'login' || prev === 'signup' || prev === 'loading') {
          return 'dashboard_shell';
        }
        return prev; // Stay on onboarding or dashboard_shell as-is.
      });
    } else {
      // Not authenticated: any protected view must redirect to login.
      setCurrentView((prev) => {
        if (prev === 'dashboard_shell' || prev === 'onboarding' || prev === 'loading') {
          return 'login';
        }
        return prev; // Already on login or signup — leave it.
      });
    }
  }, [user, loading]);

  // ── Navigation handlers ─────────────────────────────────────────────────────

  const handleNavigateToLogin = () => {
    // Guard: authenticated users cannot visit login — send to dashboard.
    if (user) { setCurrentView('dashboard_shell'); return; }
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    // Guard: authenticated users cannot visit signup — send to dashboard.
    if (user) { setCurrentView('dashboard_shell'); return; }
    setCurrentView('signup');
  };

  // Called after account registration with email-confirm flow → go to Login.
  const handleRegisterSuccess = () => {
    setCurrentView('login');
  };

  // Called after successful LOGIN (LoginForm.onSuccess).
  // Supabase onAuthStateChange already updated AuthContext; the guard useEffect
  // above will fire and transition to dashboard_shell automatically.
  // We call it here too for instant feedback without waiting for the next render cycle.
  const handleLoginSuccess = () => {
    setDashboardRoute('/dashboard');
    setCurrentView('dashboard_shell');
  };

  // Called after the onboarding health profile is saved.
  const handleOnboardingSuccess = () => {
    setDashboardRoute('/dashboard');
    setCurrentView('dashboard_shell');
  };

  // Internal dashboard sub-route navigation handler.
  const handleDashboardNavigate = (routePath) => {
    setDashboardRoute(routePath);
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  // Signs out from Supabase (clears session), then navigates to Login.
  // The AuthContext onAuthStateChange listener will also fire and set user → null,
  // so the guard useEffect above provides a second safety net.
  const handleLogout = async () => {
    await signOut();
    setCurrentView('login');
    setDashboardRoute('/dashboard');
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  // Supabase session check is in flight — render nothing rather than flashing Login.
  if (loading || currentView === 'loading') {
    return null;
  }

  return (
    <div className="app-root">
      {/* 1. Register View — public */}
      {currentView === 'signup' && (
        <Signup
          onNavigateToLogin={handleNavigateToLogin}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* 2. Login View — public */}
      {currentView === 'login' && (
        <Login
          onNavigateToSignup={handleNavigateToSignup}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* 3. Health Profile Onboarding — authenticated, first-time only */}
      {currentView === 'onboarding' && (
        <HealthProfilePage onSuccess={handleOnboardingSuccess} />
      )}

      {/* 4. MediGuard Dashboard Application Shell — authenticated */}
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
              currentUser={user}
              isMobileMenuOpen={isMobileMenuOpen}
              onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
            />

            {/* Main Sub-Page Views */}
            <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
              {dashboardRoute === '/dashboard' && (
                <Dashboard currentUser={user} onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/medicines' && (
                <Medicines onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/safety-check' && (
                <SafetyCheck
                  currentUser={user}
                  onNavigate={handleDashboardNavigate}
                  onViewDetails={(interaction) => {
                    setSelectedInteraction(interaction);
                    setDashboardRoute('/interaction-details');
                  }}
                />
              )}

              {dashboardRoute === '/interaction-details' && (
                <InteractionDetails
                  interaction={selectedInteraction}
                  onBack={() => setDashboardRoute('/safety-check')}
                />
              )}

              {dashboardRoute === '/history' && (
                <History onNavigate={handleDashboardNavigate} />
              )}

              {dashboardRoute === '/profile' && (
                <Profile currentUser={user} onUpdateUser={() => {}} />
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
