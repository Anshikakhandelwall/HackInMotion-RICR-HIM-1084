/**
 * Backend authentication service.
 *
 * Provides functions that call the Django backend's Supabase-protected
 * authentication endpoints. Proofs the full chain:
 *
 *   Frontend Supabase session
 *     → access token
 *     → Authorization header
 *     → Django SupabaseAuthentication
 *     → JWT verification
 *     → authenticated response
 *
 * Do NOT use for Supabase-direct auth calls — those live in authService.js.
 */
import { apiFetch } from '../api/apiClient';

/**
 * Fetch the authenticated Django identity for the current Supabase session.
 *
 * Endpoint: GET /api/auth/supabase/me/
 *
 * Returns an object containing:
 *   - authenticated: true
 *   - supabase_user_id: string (the JWT `sub` claim)
 *   - email: string
 *   - django_user_id: number
 *
 * @returns {Promise<{authenticated: boolean, supabase_user_id: string, email: string, django_user_id: number}>}
 * @throws {Error} on 401 (not authenticated) or network failure
 */
export const getCurrentBackendUser = () =>
  apiFetch('/api/auth/supabase/me/');
