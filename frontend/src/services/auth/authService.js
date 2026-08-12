/**
 * Authentication Service Module
 * Handles user registration, login, and session tokens.
 */

/**
 * Register a new user with MediGuard backend API.
 * @param {Object} userData - { fullName, email, password }
 * @returns {Promise<Object>} Response data from registration endpoint
 */
export const registerUser = async (userData) => {
  // TODO: Connect to backend API endpoint (e.g., POST /api/auth/register/)
  // Example future implementation:
  // const response = await fetch('/api/auth/register/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     full_name: userData.fullName,
  //     email: userData.email,
  //     password: userData.password,
  //   }),
  // });
  // if (!response.ok) {
  //   const errorData = await response.json();
  //   throw new Error(errorData.detail || 'Registration failed');
  // }
  // return await response.json();

  // Temporary simulation for frontend validation & UX testing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Account created successfully',
        user: {
          email: userData.email,
          fullName: userData.fullName,
        },
      });
    }, 800);
  });
};

/**
 * Login a user with MediGuard backend API.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Response data from login endpoint (user + token)
 */
export const loginUser = async (credentials) => {
  // TODO: Connect to backend API endpoint (e.g., POST /api/auth/login/)
  // Example future implementation:
  // const response = await fetch('/api/auth/login/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     email: credentials.email,
  //     password: credentials.password,
  //   }),
  // });
  // if (!response.ok) {
  //   const errorData = await response.json();
  //   throw new Error(errorData.detail || 'Login failed');
  // }
  // return await response.json();

  // Temporary simulation for frontend validation & UX testing
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simple validation: reject if email/password empty (should be caught by form validation)
      if (!credentials.email || !credentials.password) {
        reject(new Error('Email and password are required'));
        return;
      }
      resolve({
        success: true,
        message: 'Login successful',
        user: {
          email: credentials.email,
        },
        token: 'mock-jwt-token-' + Date.now(),
      });
    }, 800);
  });
};
