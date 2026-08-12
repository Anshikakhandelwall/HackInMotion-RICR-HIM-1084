/**
 * Authentication Service Module
 * Connects React frontend with MediGuard Django backend API for authentication flows:
 * registration, login, token storage, user profile, and logout.
 */

const API_BASE_URL = ''; // Relative path leverages Vite dev proxy (/api -> http://127.0.0.1:8000)

/**
 * Helper to store auth tokens and user session data in localStorage.
 * @param {string} token 
 * @param {Object} user 
 */
export const storeAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem('authToken', token);
  }
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

/**
 * Get current stored authentication token.
 * @returns {string|null}
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get current stored user object.
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

/**
 * Clear stored auth session from localStorage.
 */
export const clearAuthSession = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

/**
 * Register a new user with MediGuard backend API.
 * @param {Object} userData - { fullName, email, password }
 * @returns {Promise<Object>} Response data containing token and user profile
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Registration failed');
    throw new Error(errorMsg);
  }

  // Store auth session
  storeAuthSession(data.token, data.user);

  return data;
};

/**
 * Login a user with MediGuard backend API.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Response data containing token and user profile
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Login failed');
    throw new Error(errorMsg);
  }

  // Store auth session
  storeAuthSession(data.token, data.user);

  return data;
};

/**
 * Logout the current authenticated user.
 * @returns {Promise<Object>} Response data from logout endpoint
 */
export const logoutUser = async () => {
  const token = getAuthToken();

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });
    } catch (error) {
      console.warn('Network error during logout:', error);
    }
  }

  clearAuthSession();
  return { success: true, message: 'Logged out successfully' };
};

/**
 * Fetch fresh user profile details from backend using stored Token.
 * @returns {Promise<Object>}
 */
export const fetchUserProfile = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    if (response.status === 401) {
      clearAuthSession();
    }
    throw new Error(data.message || 'Failed to fetch user profile');
  }

  if (data.user) {
    localStorage.setItem('currentUser', JSON.stringify(data.user));
  }

  return data.user;
};
