/**
 * Settings Service
 * Manages user notification preferences, data export, and account operations.
 *
 * All requests go through the central apiFetch which automatically attaches
 * the Supabase Bearer token. No user IDs or tokens are hardcoded here.
 */
import { apiFetch } from '../api/apiClient';

const SETTINGS_URL = '/api/settings/';

/**
 * Fetch the authenticated user's settings from the backend.
 * @returns {Promise<{ success: boolean, settings: object }>}
 */
export const getSettings = () => apiFetch(SETTINGS_URL);

/**
 * Partially update the authenticated user's settings.
 * @param {object} data — only the fields to change
 * @returns {Promise<{ success: boolean, settings: object }>}
 */
export const updateSettings = (data) =>
  apiFetch(SETTINGS_URL, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/**
 * Request a data export for the authenticated user.
 * Returns JSON containing profile, medicines, and settings.
 * @returns {Promise<{ success: boolean, export: object }>}
 */
export const exportUserData = () => apiFetch('/api/settings/export/');

/**
 * Permanently delete the authenticated user's account.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteAccount = () =>
  apiFetch('/api/settings/account/', { method: 'DELETE' });
