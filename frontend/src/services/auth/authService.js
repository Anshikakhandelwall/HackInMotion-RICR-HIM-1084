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
