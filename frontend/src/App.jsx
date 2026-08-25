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
import SafetyCheckResults from './pages/SafetyCheck/SafetyCheckResults';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage';
import LandingPage from './pages/Landing/LandingPage';
import { NotificationProvider } from './context/NotificationContext';
import useAuth from './hooks/useAuth';
import { getProfile, updateProfile } from './services/profile/profileService';
import { getUserDisplayName } from './utils/userUtils';

function App() {
  const { user, loading, signOut, authEvent } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  // ── View state machine ──────────────────────────────────────────────────
  // 'loading'          — waiting for Supabase session OR profile check
  // 'landing'          — public landing page
  // 'login'            — unauthenticated
  // 'signup'           — unauthenticated
  // 'forgot_password'  — unauthenticated, forgot-password form
  // 'reset_password'   — RECOVERY session active, new-password form
  // 'onboarding'       — authenticated, profile incomplete
  // 'dashboard_shell'  — authenticated, profile complete
  const [currentView, setCurrentView] = useState('loading');
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  // Safety Check Results state
  const [safetyCheckResult, setSafetyCheckResult] = useState(null);
  const [safetyCheckMedicines, setSafetyCheckMedicines] = useState([]);
  const [safetyCheckMeta, setSafetyCheckMeta] = useState({});

  // ── Handle backend 401 → force logout ──────────────────────────────────
  // apiClient dispatches this event when the Django API rejects the token.
  // Supabase sign-out has already been called by apiClient; we just update view.
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentView('login');
      setDashboardRoute('/dashboard');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // ── Handle Supabase RECOVERY event (password-reset link clicked) ────────
  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      setCurrentView('reset_password');
    }
  }, [authEvent]);

  // ── Profile-completion check ────────────────────────────────────────────
  // Runs once per authenticated session (after Supabase resolves + user is set).
  // Queries Django /api/profile/ to determine whether to show onboarding or
  // dashboard. The view stays 'loading' until this check completes, preventing
  // the unwanted Login → Dashboard → Onboarding flash.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not authenticated — go to landing unless already on a public view.
      setCurrentView((prev) => {
        const publicViews = ['landing', 'login', 'signup', 'forgot_password'];
        return publicViews.includes(prev) ? prev : 'landing';
      });
      return;
    }

    // RECOVERY session: user is authenticated for password reset only.
    // Do not redirect to dashboard or run profile check.
    if (authEvent === 'PASSWORD_RECOVERY') {
      setCurrentView('reset_password');
      return;
    }

    // User is authenticated — check backend profile completion.
    // Stay in 'loading' view until the check resolves.
    setCurrentView('loading');

    getProfile()
      .then((res) => {
        const profileData = res?.profile || null;
        setUserProfile(profileData);
        const completed = profileData?.profileCompleted === true;
        setCurrentView(completed ? 'dashboard_shell' : 'onboarding');
      })
      .catch(() => {
        // 404 (no profile yet) or network error → send to onboarding
        setUserProfile(null);
        setCurrentView('onboarding');
      });
  }, [user, loading, authEvent]);

  // Helper to update user profile in local state and call Django backend PATCH /api/profile/
  const handleUpdateProfileData = async (updatedFields) => {
    try {
      const res = await updateProfile(updatedFields);
      if (res && res.profile) {
        setUserProfile(res.profile);
      }
      return res;
    } catch (err) {
      console.error('Failed to update user profile:', err);
      throw err;
    }
  };

  // Combine auth user with DB profile data
  const combinedUser = {
    ...user,
    ...(userProfile || {}),
  };
  const resolvedDisplayName = getUserDisplayName(combinedUser);
  const fullUser = {
    ...combinedUser,
    fullName: resolvedDisplayName,
    full_name: resolvedDisplayName,
    name: resolvedDisplayName,
  };

  // ── Navigation helpers ──────────────────────────────────────────────────

  const handleNavigateToLogin = () => {
    if (user && authEvent !== 'PASSWORD_RECOVERY') {
      setCurrentView('dashboard_shell');
      return;
    }
    setCurrentView('login');
  };

  const handleNavigateToSignup = () => {
    if (user && authEvent !== 'PASSWORD_RECOVERY') {
      setCurrentView('dashboard_shell');
      return;
    }
    setCurrentView('signup');
  };

  const handleNavigateToForgotPassword = () => setCurrentView('forgot_password');

  // After email-confirm signup → show login
  const handleRegisterSuccess = () => setCurrentView('login');

  // After login — profile check runs via useEffect when user state updates.
  const handleLoginSuccess = () => setCurrentView('loading');

  // After onboarding form saved → profile is now complete
  const handleOnboardingSuccess = (createdProfile) => {
    if (createdProfile) {
      setUserProfile(createdProfile);
    }
    setDashboardRoute('/dashboard');
    setCurrentView('dashboard_shell');
  };


  // After new password set successfully → back to login (Supabase signs out)
  const handleResetPasswordSuccess = () => {
    signOut().catch(() => {});
    setCurrentView('login');
  };

  const handleDashboardNavigate = (routePath) => setDashboardRoute(routePath);

  // ── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    setUserProfile(null);
    setCurrentView('login');
    setDashboardRoute('/dashboard');
  };

  // ── Loading screen (Supabase check + profile check) ────────────────────
  if (loading || currentView === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#0E7490', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748B', fontFamily: 'sans-serif', fontSize: '0.95rem', margin: 0 }}>Loading MediGuard...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider currentUser={fullUser}>
      <div className="app-root">
        {/* 0. Landing Page — public */}
        {currentView === 'landing' && (
          <LandingPage
            onNavigateToLogin={handleNavigateToLogin}
            onNavigateToSignup={handleNavigateToSignup}
          />
        )}

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
            onForgotPassword={handleNavigateToForgotPassword}
            onSuccess={handleLoginSuccess}
          />
        )}

        {/* 3. Forgot password — public */}
        {currentView === 'forgot_password' && (
          <ForgotPasswordPage
            onBackToLogin={handleNavigateToLogin}
          />
        )}

        {/* 4. Reset password — RECOVERY session */}
        {currentView === 'reset_password' && (
          <ResetPasswordPage onSuccess={handleResetPasswordSuccess} />
        )}

        {/* 5. Health Profile Onboarding — authenticated, profile incomplete */}
        {currentView === 'onboarding' && (
          <HealthProfilePage onSuccess={handleOnboardingSuccess} />
        )}

        {/* 6. Dashboard Application Shell — authenticated, profile complete */}
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
                currentUser={fullUser}
                isMobileMenuOpen={isMobileMenuOpen}
                onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
              />

              <main style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>
                {dashboardRoute === '/dashboard' && (
                  <Dashboard currentUser={fullUser} onNavigate={handleDashboardNavigate} />
                )}

                {dashboardRoute === '/medicines' && (
                  <Medicines
                    currentUser={fullUser}
                    onUpdateProfile={handleUpdateProfileData}
                    onNavigate={handleDashboardNavigate}
                  />
                )}

                {dashboardRoute === '/safety-check' && (
                  <SafetyCheck
                    currentUser={fullUser}
                    onNavigate={handleDashboardNavigate}
                    onViewDetails={(interaction) => {
                      setSelectedInteraction(interaction);
                      setDashboardRoute('/interaction-details');
                    }}
                    onResultsReady={(result, medicines, meta) => {
                      setSafetyCheckResult(result);
                      setSafetyCheckMedicines(medicines);
                      setSafetyCheckMeta(meta);
                      setDashboardRoute('/safety-check-results');
                    }}
                  />
                )}

                {dashboardRoute === '/safety-check-results' && (
                  <SafetyCheckResults
                    result={safetyCheckResult}
                    medicines={safetyCheckMedicines}
                    checkMeta={safetyCheckMeta}
                    currentUser={fullUser}
                    onBack={() => setDashboardRoute('/safety-check')}
                    onViewInteraction={(interaction) => {
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
                  <Profile currentUser={fullUser} onUpdateProfile={handleUpdateProfileData} />
                )}

                {dashboardRoute === '/settings' && (
                  <SettingsPage />
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
}

export default App;
