// TODO: Connect this service to the approved medicine dataset/API.

/**
 * Service abstraction for medicine database search.
 * This service provides a clean integration interface for future medicine API lookup.
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

  // Temporary frontend integration placeholder before API connection
  return {
    success: true,
    results: [],
    isPlaceholder: true,
    message: 'Medicine search will be available when the medicine database is connected.',
  };
};

export default {
  searchMedicines,
};
