/**
 * Drug Interaction Service Module
 * Connects React frontend with MediGuard Django backend API for drug interaction screening.
 */

import { apiFetch } from '../api/apiClient';

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
    const data = await apiFetch('/api/interactions/check/', {
      method: 'POST',
      body: JSON.stringify({
        medicines: medicinePayload,
      }),
    });

    // supporting_evidence is provided by the backend when openFDA is configured.
    // It is always present in the response (may be an empty array).
    return {
      ...data,
      supporting_evidence: data.supporting_evidence || [],
    };
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    throw error;
  }
};

export const checkPersonalizedSafety = async (medicines, medicalConditions = '') => {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return {
      success: true,
      has_warnings: false,
      summary: {
        total_medicines_checked: 0,
        drug_interactions_count: 0,
        condition_warnings_count: 0,
        major_warnings: 0,
        moderate_warnings: 0,
      },
      drug_interactions: { interactions: [] },
      patient_condition_warnings: [],
    };
  }

  const medicinePayload = medicines.map((item) => {
    if (typeof item === 'string') return item;
    return item.rxcui || item.rxnorm_name || item.name || String(item.id || '');
  }).filter(Boolean);

  try {
    const data = await apiFetch('/api/patients/safety-check/', {
      method: 'POST',
      body: JSON.stringify({
        medicines: medicinePayload,
        medicalConditions,
      }),
    });

    return data;
  } catch (error) {
    console.error('Error running personalized safety check:', error);
    throw error;
  }
};

export const getInteractionExplanation = async (drugA, drugB, severity = 'Major') => {
  try {
    const data = await apiFetch('/api/interactions/explain/', {
      method: 'POST',
      body: JSON.stringify({
        drug_a: drugA,
        drug_b: drugB,
        severity,
      }),
    });
    return data;
  } catch (error) {
    console.error('Error fetching interaction explanation from AI backend:', error);
    throw error;
  }
};

export default {
  checkInteractions,
  checkPersonalizedSafety,
  getInteractionExplanation,
};

