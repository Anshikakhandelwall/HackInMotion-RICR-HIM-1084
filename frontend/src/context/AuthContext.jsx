import { createContext, useEffect, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  resetPasswordForEmail as authResetPassword,
  updatePassword as authUpdatePassword,
} from '../services/auth/authService';

const AuthContext = createContext(null);

/**
 * Provides Django REST Framework JWT authentication state to the component tree.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null);

  useEffect(() => {
    const isSessionExpired = () => {
      const loginTimeStr = localStorage.getItem('mediguard_login_time');
      if (!loginTimeStr) return false;
      const loginTime = parseInt(loginTimeStr, 10);
      const timeElapsed = Date.now() - loginTime;
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      return timeElapsed > FIFTEEN_MINUTES;
    };

    const handleSessionExpiration = async () => {
      localStorage.removeItem('mediguard_login_time');
      try {
        await authSignOut();
      } catch (e) {
        console.error('Failed to sign out expired session:', e);
      }
      setUser(null);
      setSession(null);
      setLoading(false);
    };

    // 1. Hydrate session on mount
    if (isSessionExpired()) {
      handleSessionExpiration();
    } else {
      getSession()
        .then((res) => {
          const initialSession = res?.data?.session ?? null;
          if (isSessionExpired()) {
            handleSessionExpiration();
          } else {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
          }
        })
        .catch((err) => {
          console.warn('Auth session error:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange((event, updatedSession) => {
      if (isSessionExpired()) {
        handleSessionExpiration();
      } else {
        setAuthEvent(event);
        setSession(updatedSession);
        setUser(updatedSession?.user ?? null);
        setLoading(false);
      }
    });

    // 3. Background dynamic session checker (every 10 seconds)
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        handleSessionExpiration();
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSignIn = async (email, password) => {
    const result = await authSignIn(email, password);
    if (!result.error && result.data?.user) {
      localStorage.setItem('mediguard_login_time', Date.now().toString());
      setUser(result.data.user);
      setSession(result.data.session);
    }
    return result;
  };

  const handleSignUp = async (email, password, metadata) => {
    const result = await authSignUp(email, password, metadata);
    if (!result.error) {
      // Clear any automatic local session to prevent auto-login
      await authSignOut();
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const handleSignOut = async () => {
    await authSignOut();
    localStorage.removeItem('mediguard_login_time');
    setUser(null);
    setSession(null);
    setAuthEvent('SIGNED_OUT');
  };

  const value = {
    user,
    session,
    loading,
    authEvent,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: (email, redirectTo = window.location.origin) =>
      authResetPassword(email, redirectTo),
    updatePassword: (newPassword) => authUpdatePassword(newPassword),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
