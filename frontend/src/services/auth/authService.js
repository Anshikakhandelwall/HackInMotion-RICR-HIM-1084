/**
 * Authentication Service
 * Thin wrapper around Supabase Auth — all auth calls go through here.
 *
 * This file contains ONLY active, used functions.
 * All legacy localStorage shims have been removed.
 */
import { supabase } from './supabaseClient';

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @param {Object} [metadata] - Optional user metadata (e.g. { full_name })
 * @returns {Promise<{data, error}>}
 */
export const signUp = (email, password, metadata = {}) =>
  supabase.auth.signUp({ email, password, options: { data: metadata } });

/**
 * Sign in an existing user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

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
 * Supabase sends a recovery link; the user clicks it and is redirected to
 * the app where they can set a new password via updatePassword().
 *
 * @param {string} email
 * @param {string} redirectTo - Full URL Supabase redirects to after the link is clicked.
 * @returns {Promise<{data, error}>}
 */
export const resetPasswordForEmail = (email, redirectTo) =>
  supabase.auth.resetPasswordForEmail(email, { redirectTo });

/**
 * Set a new password for the currently authenticated recovery session.
 * Must be called after the user has clicked the Supabase recovery link
 * and the resulting RECOVERY event has set an active session.
 *
 * @param {string} newPassword
 * @returns {Promise<{data, error}>}
 */
export const updatePassword = (newPassword) =>
  supabase.auth.updateUser({ password: newPassword });
