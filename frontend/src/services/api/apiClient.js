/**
 * Central API client for Django REST Framework backend requests.
 *
 * Automatically attaches the current Django JWT access token as:
 *   Authorization: Bearer <access_token>
 *
 * Behaviour on 401:
 *   Attempts silent refresh via refreshAccessToken().
 *   If refresh fails, clears stored auth data and dispatches 'auth:unauthorized'.
 */
import {
  getStoredAccessToken,
  refreshAccessToken,
  clearStoredAuthData,
} from '../auth/authService';

const API_BASE = '';

/**
 * Fetch wrapper that attaches the JWT Bearer token and handles auto-refresh on 401.
 *
 * @param {string} path      - API path, e.g. '/api/profile/'
 * @param {RequestInit} [options] - Standard fetch options (method, body, etc.)
 * @returns {Promise<any>}   - Parsed JSON response body
 * @throws {Error}           - On HTTP errors or network failures
 */
export const apiFetch = async (path, options = {}) => {
  let token = getStoredAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, attempt to refresh access token silently
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuthData();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
      else if (body?.message) message = body.message;
    } catch {
      // Non-JSON error body — keep default message
    }
    throw new Error(message);
  }

  return response.json();
};
