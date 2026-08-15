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
    // 1. Hydrate session from localStorage and /api/auth/me/ on mount.
    getSession()
      .then((res) => {
        const initialSession = res?.data?.session ?? null;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      })
      .catch((err) => {
        console.warn('Auth session error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Subscribe to auth state changes.
    const { data: { subscription } } = onAuthStateChange((event, updatedSession) => {
      setAuthEvent(event);
      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email, password) => {
    const result = await authSignIn(email, password);
    if (!result.error && result.data?.user) {
      setUser(result.data.user);
      setSession(result.data.session);
    }
    return result;
  };

  const handleSignUp = async (email, password, metadata) => {
    const result = await authSignUp(email, password, metadata);
    if (!result.error && result.data?.user) {
      setUser(result.data.user);
      setSession(result.data.session);
    }
    return result;
  };

  const handleSignOut = async () => {
    await authSignOut();
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
