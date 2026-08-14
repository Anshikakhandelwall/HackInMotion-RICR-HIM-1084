/**
 * Central API client for Django backend requests.
 *
 * Automatically attaches the current Supabase access token as:
 *   Authorization: Bearer <access_token>
 *
 * Behaviour on 401:
 *   Signs the user out of Supabase and dispatches a custom
 *   'auth:unauthorized' window event so the application can
 *   transition to the login view without importing the auth
 *   context here (avoids circular dependencies).
 *
 * Never stores or logs the access token.
 */
import { supabase } from '../auth/supabaseClient';

const API_BASE = '';  // Relative — relies on Vite dev proxy (/api → Django :8000)

/**
 * Fetch wrapper that attaches the Supabase Bearer token.
 *
 * @param {string} path      - API path, e.g. '/api/auth/supabase/me/'
 * @param {RequestInit} [options] - Standard fetch options (method, body, etc.)
 * @returns {Promise<any>}   - Parsed JSON response body
 * @throws {Error}           - On HTTP errors or network failures
 */
export const apiFetch = async (path, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // On 401 the session is invalid or expired. Sign out silently and
    // notify the app so it can redirect to login without a stale state.
    if (response.status === 401) {
      supabase.auth.signOut().catch(() => {});
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
    } catch {
      // Non-JSON error body — keep the status message.
    }
    throw new Error(message);
  }

  return response.json();
};
