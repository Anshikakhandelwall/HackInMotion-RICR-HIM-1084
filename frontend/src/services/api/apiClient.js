/**
 * Central API client for Django backend requests.
 *
 * Automatically attaches the current Supabase access token as:
 *   Authorization: Bearer <access_token>
 *
 * Usage:
 *   import { apiFetch } from './apiClient';
 *   const data = await apiFetch('/api/auth/supabase/me/');
 *
 * The function:
 *   - Retrieves the live session from the existing Supabase client (no duplication).
 *   - Attaches the Bearer token to every request.
 *   - Throws a plain Error with a message for non-2xx responses.
 *   - Never stores or logs the access token.
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
