/**
 * Medicine Database Service Module
 * Connects React frontend with MediGuard Django backend API for medicine lookup and search.
 */

const API_BASE_URL = ''; // Relative path leverages Vite dev proxy (/api -> http://127.0.0.1:8000)

/**
 * Search canonical RxNorm medicines database via Django REST API.
 * 
 * @param {string} query - The medicine search query term
 * @returns {Promise<Object>} Search result payload containing results array and status flags
 */
export const searchMedicines = async (query) => {
  const trimmedQuery = (query || '').trim();

  // Defensive handling for empty or whitespace-only query
  if (!trimmedQuery) {
    return {
      success: true,
      results: [],
      message: '',
      isPlaceholder: false,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/medicines/?search=${encodeURIComponent(trimmedQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch medicines');
    }

    return {
      success: true,
      results: data.results || [],
      count: data.count || 0,
      isPlaceholder: false,
      message: '',
    };
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return {
      success: false,
      results: [],
      message: error.message || 'Unable to connect to medicine database',
      isPlaceholder: false,
    };
  }
};

/**
 * Fetch a single medicine by RxCUI identifier.
 * @param {string} rxcui 
 * @returns {Promise<Object>}
 */
export const getMedicineByRxCUI = async (rxcui) => {
  if (!rxcui) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/medicines/rxcui/${encodeURIComponent(rxcui)}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return data.medicine;
    }
    return null;
  } catch (error) {
    console.error('Error fetching medicine by RxCUI:', error);
    return null;
  }
};

export default {
  searchMedicines,
  getMedicineByRxCUI,
};
