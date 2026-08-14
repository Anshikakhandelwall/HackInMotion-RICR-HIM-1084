import { createContext, useEffect, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
} from '../services/auth/authService';

const AuthContext = createContext(null);

/**
 * Provides Supabase authentication state to the component tree.
 * Exposes: user, session, loading, signIn, signUp, signOut.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Retrieve the current session on mount.
    getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to future auth state changes.
    const { data: { subscription } } = onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setUser(updatedSession?.user ?? null);
      setLoading(false);
    });

    // 3. Clean up the subscription on unmount.
    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn: (email, password) => authSignIn(email, password),
    signUp: (email, password, metadata) => authSignUp(email, password, metadata),
    signOut: () => authSignOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
