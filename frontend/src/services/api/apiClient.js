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
 * Safely parse JSON response without throwing SyntaxError on empty/HTML/non-JSON bodies.
 */
const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
};

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

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Network error. Unable to reach backend server.');
  }

  // If 401 Unauthorized, attempt to refresh access token silently
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers,
        });
      } catch (netErr) {
        throw new Error('Network error during retry.');
      }
    }
  }

  const data = await safeJsonParse(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuthData();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    let message = data?.detail || data?.message || `Request failed (${response.status} ${response.statusText || ''})`;
    throw new Error(message);
  }

  return data;
};
