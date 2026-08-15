/**
 * Pure Django REST Framework JWT Authentication Service.
 * Self-contained auth service with zero external vendor dependencies.
 *
 * Stores JWT tokens securely in localStorage:
 *   mediguard_access_token
 *   mediguard_refresh_token
 *   mediguard_user
 */

const TOKEN_KEY = 'mediguard_access_token';
const REFRESH_KEY = 'mediguard_refresh_token';
const USER_KEY = 'mediguard_user';

const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: `Server returned unexpected response (${response.status} ${response.statusText || ''}). Please try again later.`,
    };
  }
};

export const getStoredAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const storeAuthData = (data) => {
  const accessToken = data.tokens?.access || data.token;
  const refreshToken = data.tokens?.refresh;
  const user = data.user;

  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Register a new user with Django REST API.
 * @param {string} email
 * @param {string} password
 * @param {Object} [metadata] - Optional { fullName / full_name }
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const response = await fetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        fullName: metadata.full_name || metadata.fullName || '',
      }),
    });

    const data = await safeJsonParse(response);
    if (!response.ok || !data.success) {
      return {
        data: { user: null, session: null },
        error: { message: data.message || 'Registration failed.' },
      };
    }

    storeAuthData(data);
    return {
      data: {
        user: data.user,
        session: { access_token: data.tokens?.access || data.token },
      },
      error: null,
    };
  } catch (err) {
    return {
      data: { user: null, session: null },
      error: { message: err.message || 'Network error during registration.' },
    };
  }
};

/**
 * Sign in an existing user with email + password.
 * @param {string} email
 * @param {string} password
 */
export const signIn = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJsonParse(response);
    if (!response.ok || !data.success) {
      return {
        data: { user: null, session: null },
        error: { message: data.message || 'Invalid email or password.' },
      };
    }

    storeAuthData(data);
    return {
      data: {
        user: data.user,
        session: { access_token: data.tokens?.access || data.token },
      },
      error: null,
    };
  } catch (err) {
    return {
      data: { user: null, session: null },
      error: { message: err.message || 'Network error during sign in.' },
    };
  }
};

/**
 * Sign out the currently authenticated user.
 */
export const signOut = async () => {
  const token = getStoredAccessToken();
  if (token) {
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearStoredAuthData();
  return { error: null };
};

/**
 * Refresh the JWT access token using the stored refresh token.
 */
export const refreshAccessToken = async () => {
  const refresh = getStoredRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    const data = await safeJsonParse(response);
    if (response.ok && data.success) {
      storeAuthData(data);
      return data.tokens?.access || data.token;
    }
  } catch {
    // Refresh failed
  }

  clearStoredAuthData();
  return null;
};

/**
 * Fetch the authenticated user from /api/auth/me/.
 */
export const fetchMe = async () => {
  let token = getStoredAccessToken();
  if (!token) return null;

  try {
    let response = await fetch('/api/auth/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      // Try refresh
      const newToken = await refreshAccessToken();
      if (!newToken) return null;

      response = await fetch('/api/auth/me/', {
        headers: { Authorization: `Bearer ${newToken}` },
      });
    }

    if (response.ok) {
      const data = await safeJsonParse(response);
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
    }
  } catch {
    // Network failure
  }

  return getStoredUser();
};

export const getSession = async () => {
  const token = getStoredAccessToken();
  if (!token) return { data: { session: null } };
  const user = await fetchMe();
  if (!user) return { data: { session: null } };
  return {
    data: {
      session: { access_token: token, user },
    },
  };
};

export const getUser = () => getStoredUser();

export const onAuthStateChange = (callback) => {
  const listener = () => {
    const token = getStoredAccessToken();
    const user = getStoredUser();
    callback(token ? 'SIGNED_IN' : 'SIGNED_OUT', token ? { access_token: token, user } : null);
  };

  window.addEventListener('auth:state_change', listener);
  window.addEventListener('auth:unauthorized', listener);

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          window.removeEventListener('auth:state_change', listener);
          window.removeEventListener('auth:unauthorized', listener);
        },
      },
    },
  };
};

export const resetPasswordForEmail = async () => {
  return { data: {}, error: null };
};

export const updatePassword = async () => {
  return { data: {}, error: null };
};
