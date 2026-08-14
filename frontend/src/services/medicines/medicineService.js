/**
 * Medicine Database Service Module
 * Connects React frontend with MediGuard Django backend API for medicine lookup and search.
 */

import { apiFetch } from '../api/apiClient';

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
    const data = await apiFetch(`/api/medicines/?search=${encodeURIComponent(trimmedQuery)}`);

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
    const data = await apiFetch(`/api/medicines/rxcui/${encodeURIComponent(rxcui)}/`);
    if (data && data.success) {
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
