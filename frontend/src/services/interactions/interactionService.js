/**
 * Drug Interaction Service Module
 * Connects React frontend with MediGuard Django backend API for drug interaction screening.
 */

const API_BASE_URL = ''; // Relative path leverages Vite dev proxy (/api -> http://127.0.0.1:8000)

/**
 * Check drug-drug interactions for a list of selected medicines or RxCUIs.
 * 
 * @param {Array<string|Object>} medicines - List of medicine names, RxCUIs, or objects
 * @returns {Promise<Object>} Response containing interaction results and severity summary
 */
export const checkInteractions = async (medicines) => {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return {
      success: true,
      has_interactions: false,
      summary: {
        total_checked: 0,
        pairs_checked: 0,
        interactions_found: 0,
        major: 0,
        moderate: 0,
        minor: 0,
      },
      checked_medicines: [],
      interactions: [],
    };
  }

  // Extract RxCUI or name strings from input list
  const medicinePayload = medicines.map((item) => {
    if (typeof item === 'string') return item;
    return item.rxcui || item.rxnorm_name || item.name || String(item.id || '');
  }).filter(Boolean);

  try {
    const response = await fetch(`${API_BASE_URL}/api/interactions/check/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        medicines: medicinePayload,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to check drug interactions'));
    }

    return data;
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    throw error;
  }
};

export default {
  checkInteractions,
};
