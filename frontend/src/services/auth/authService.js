/**
 * Authentication Service
 * Thin wrapper around Supabase Auth – all errors are propagated; no fallbacks.
 */
import { supabase } from './supabaseClient';

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @param {Object} [metadata] - Optional user metadata (e.g. { full_name })
 * @returns {Promise<{data, error}>}
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const result = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    if (result.error) {
      console.error('Supabase signUp error:', result.error);
    }
    return result;
  } catch (err) {
    console.error('Supabase signUp exception:', err);
    return { data: { user: null, session: null }, error: err };
  }
};

/**
 * Sign in an existing user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export const signIn = async (email, password) => {
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      console.error('Supabase signIn error:', result.error);
    }
    return result;
  } catch (err) {
    console.error('Supabase signIn exception:', err);
    return { data: { user: null, session: null }, error: err };
  }
};

/**
 * Sign out the currently authenticated user.
 * @returns {Promise<{error}>}
 */
export const signOut = () => supabase.auth.signOut();

/**
 * Retrieve the active session (null if not authenticated).
 * @returns {Promise<{data: {session}, error}>}
 */
export const getSession = () => supabase.auth.getSession();

/**
 * Retrieve the currently authenticated user object.
 * @returns {Promise<{data: {user}, error}>}
 */
export const getUser = () => supabase.auth.getUser();

/**
 * Subscribe to authentication state changes.
 * @param {Function} callback - Called with (event, session) on every change.
 * @returns {{ data: { subscription } }} - Call subscription.unsubscribe() to clean up.
 */
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);

/**
 * Request a password-reset email from Supabase.
 * @param {string} email
 * @param {string} redirectTo
 * @returns {Promise<{data, error}>}
 */
export const resetPasswordForEmail = (email, redirectTo) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo });

/**
 * Set a new password for the currently authenticated recovery session.
 * @param {string} newPassword
 * @returns {Promise<{data, error}>}
 */
export const updatePassword = (newPassword) =>
  supabase.auth.updateUser({ password: newPassword });
