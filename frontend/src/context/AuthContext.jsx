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
 * Provides Supabase authentication state to the component tree.
 *
 * Exposes:
 *   user, session, loading, authEvent,
 *   signIn, signUp, signOut,
 *   resetPassword, updatePassword
 *
 * authEvent reflects the last Supabase auth event string, e.g. 'RECOVERY',
 * so consumers can respond to the password-reset redirect flow.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState(null);

  useEffect(() => {
    // 1. Hydrate from the existing session on mount.
    getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to future auth state changes (sign-in, sign-out, RECOVERY, …).
    const { data: { subscription } } = onAuthStateChange((event, updatedSession) => {
      setAuthEvent(event);
      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);
    });

    // 3. Clean up on unmount.
    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    authEvent,
    signIn: (email, password) => authSignIn(email, password),
    signUp: (email, password, metadata) => authSignUp(email, password, metadata),
    signOut: () => authSignOut(),
    /**
     * Send a password-reset email.
     * @param {string} email
     * @param {string} [redirectTo] — defaults to the current origin
     */
    resetPassword: (email, redirectTo = window.location.origin) =>
      authResetPassword(email, redirectTo),
    /**
     * Set a new password during a RECOVERY session.
     * @param {string} newPassword
     */
    updatePassword: (newPassword) => authUpdatePassword(newPassword),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
