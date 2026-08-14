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
import { getProfile } from './services/profile/profileService';

function App() {
  const { user, loading, signOut } = useAuth();

  // ── View state machine ──────────────────────────────────────────────────
  // 'loading'          — waiting for Supabase session OR profile check
  // 'login'            — unauthenticated
  // 'signup'           — unauthenticated
  // 'onboarding'       — authenticated, profile incomplete
  // 'dashboard_shell'  — authenticated, profile complete
  const [currentView, setCurrentView] = useState('loading');
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  // ── Profile-completion check ────────────────────────────────────────────
  // Runs once per authenticated session (after Supabase resolves + user is set).
  // Queries Django /api/profile/ to determine whether to show onboarding or
  // dashboard. The view stays 'loading' until this check completes, preventing
  // the unwanted Login → Dashboard → Onboarding flash.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated — go to login (guard any protected view)
      setCurrentView((prev) =>
        prev === 'login' || prev === 'signup' ? prev : 'login'
      );
      return;
    }

    // User is authenticated — check backend profile completion.
    // Stay in 'loading' view until the check resolves.
    setCurrentView('loading');

    getProfile()
      .then((res) => {
        const completed = res?.profile?.profileCompleted === true;
        setCurrentView(completed ? 'dashboard_shell' : 'onboarding');
      })
      .catch(() => {
        // 404 (no profile yet) or network error → send to onboarding
        setCurrentView('onboarding');
      });
  }, [user, loading]);

  // ── Navigation helpers ──────────────────────────────────────────────────

  const handleNavigateToLogin = () => {
    if (user) { setCurrentView('dashboard_shell'); return; }
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    if (user) { setCurrentView('dashboard_shell'); return; }
    setCurrentView('signup');
  };

  // After email-confirm signup → show login
  const handleRegisterSuccess = () => setCurrentView('login');

  // After login — Supabase onAuthStateChange fires → user updates → useEffect
  // above triggers the profile check. We also set the view immediately for
  // instant feedback.
  const handleLoginSuccess = () => {
    // Profile check will run via useEffect when user state updates.
    // Just ensure we're not stuck on 'login'.
    setCurrentView('loading');
  };

  // After onboarding form saved → profile is now complete
  const handleOnboardingSuccess = () => {
    setDashboardRoute('/dashboard');
    setCurrentView('dashboard_shell');
  };

  const handleDashboardNavigate = (routePath) => setDashboardRoute(routePath);

  // ── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    setCurrentView('login');
    setDashboardRoute('/dashboard');
  };

  // ── Loading screen (Supabase check + profile check) ────────────────────
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

      {/* 3. Health Profile Onboarding — authenticated, profile incomplete */}
      {currentView === 'onboarding' && (
        <HealthProfilePage onSuccess={handleOnboardingSuccess} />
      )}

      {/* 4. Dashboard Application Shell — authenticated, profile complete */}
      {currentView === 'dashboard_shell' && (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#FFFDFC' }}>
          <Sidebar
            activeRoute={dashboardRoute}
            onNavigate={handleDashboardNavigate}
            onLogout={handleLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Header
              currentUser={user}
              isMobileMenuOpen={isMobileMenuOpen}
              onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
            />

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
                <Profile />
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
