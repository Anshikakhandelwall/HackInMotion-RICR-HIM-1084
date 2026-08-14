/**
 * Profile service — authenticated calls to Django /api/profile/.
 *
 * All requests automatically receive the Supabase Bearer token through
 * the central apiClient. Never duplicates token handling.
 *
 * Shape returned by the backend on success:
 *   {
 *     profile_exists: boolean,
 *     profile: {
 *       age: number | null,
 *       medicalConditions: string,
 *       regularMedicines: string[],
 *       profileCompleted: boolean,
 *       created_at: string,
 *       updated_at: string,
 *     }
 *   }
 */
import { apiFetch } from '../api/apiClient';

const PROFILE_URL = '/api/profile/';

/**
 * Fetch the authenticated user's health profile.
 * Throws with status 404 when no profile exists yet (profile_exists: false).
 * @returns {Promise<{profile_exists: boolean, profile?: object}>}
 */
export const getProfile = () => apiFetch(PROFILE_URL);

/**
 * Create or idempotently upsert the authenticated user's health profile.
 * @param {{ age: number, medicalConditions: string, regularMedicines: string[] }} data
 * @returns {Promise<{profile_exists: boolean, profile: object}>}
 */
export const createProfile = (data) =>
  apiFetch(PROFILE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Partially update the authenticated user's health profile.
 * Only the fields included in `data` are modified.
 * @param {{ age?: number, medicalConditions?: string, regularMedicines?: string[] }} data
 * @returns {Promise<{profile_exists: boolean, profile: object}>}
 */
export const updateProfile = (data) =>
  apiFetch(PROFILE_URL, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
