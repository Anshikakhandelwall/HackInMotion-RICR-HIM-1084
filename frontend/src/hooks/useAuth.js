import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Convenience hook for accessing Supabase authentication state and methods.
 *
 * Returns: { user, session, loading, signIn, signUp, signOut }
 *
 * Must be used inside <AuthProvider>.
 */
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};

export default useAuth;
