/**
 * Authentication Service
 * Thin wrapper around Supabase Auth — all auth calls go through here.
 */
import { supabase } from './supabaseClient';

// ---------------------------------------------------------------------------
// Legacy localStorage helpers — kept for backward compatibility with App.jsx
// and Profile.jsx until those components are migrated in later commits.
// ---------------------------------------------------------------------------

/** @returns {Object|null} */
export const getCurrentUser = () => {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

/** @returns {boolean} */
export const isProfileCompleted = () => {
  const user = getCurrentUser();
  if (user) return Boolean(user.profileCompleted || user.profile_completed);
  return localStorage.getItem('mediGuard_profileCompleted') === 'true';
};

/** Clears the legacy localStorage session. */
export const clearAuthSession = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('mediGuard_profileCompleted');
};

/**
 * Legacy logout — clears session storage.
 * App.jsx calls this until it is migrated to AuthContext.signOut in Commit 3.
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  await supabase.auth.signOut();
  clearAuthSession();
};

/**
 * Legacy profile save — persists health profile data to localStorage.
 * Profile.jsx calls this until it is migrated to Supabase in Commit 3.
 * @param {Object} profileData - { age, medicalConditions, regularMedicines }
 * @returns {Promise<Object>} Updated user object
 */
export const saveHealthProfile = async (profileData) => {
  const currentUser = getCurrentUser() || {};
  const updatedUser = {
    ...currentUser,
    age: profileData.age,
    medicalConditions: profileData.medicalConditions,
    regularMedicines: profileData.regularMedicines,
    profileCompleted: true,
    profile_completed: true,
  };
  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  localStorage.setItem('mediGuard_profileCompleted', 'true');
  return updatedUser;
};

/**
 * Legacy login — wraps signInWithPassword in the old { success, token, user } contract.
 * LoginForm.jsx calls this until it is migrated to AuthContext.signIn in Commit 3.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ success: boolean, token: string, user: Object }>}
 */
export const loginUser = async (credentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) throw new Error(error.message);
  const user = data.session?.user ?? null;
  return { success: true, token: data.session?.access_token ?? '', user };
};

/**
 * Legacy register — wraps signUp in the old { success } contract.
 * RegisterForm.jsx calls this until it is migrated to AuthContext.signUp in Commit 3.
 * @param {{ fullName: string, email: string, password: string }} userData
 * @returns {Promise<{ success: boolean }>}
 */
export const registerUser = async (userData) => {
  const { error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: { data: { full_name: userData.fullName } },
  });
  if (error) throw new Error(error.message);
  return { success: true };
};

// ---------------------------------------------------------------------------

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
