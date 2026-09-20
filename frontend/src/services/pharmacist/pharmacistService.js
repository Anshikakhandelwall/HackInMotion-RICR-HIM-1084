/**
 * Pharmacist service — authenticated calls to /api/rbac/pharmacist/ endpoints.
 */
import { apiFetch } from '../api/apiClient';

const BASE = '/api/rbac/pharmacist';

export const pharmacistService = {
  /** List all cases belonging to the authenticated pharmacist. */
  getCases: () => apiFetch(`${BASE}/cases/`),

  /** Create a new screening case. */
  createCase: (data) =>
    apiFetch(`${BASE}/cases/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** Get a single case by ID. */
  getCase: (id) => apiFetch(`${BASE}/cases/${id}/`),

  /**
   * Partially update a case.
   * Accepts: title, medicines, notes, patient_id (null to unlink).
   */
  updateCase: (id, data) =>
    apiFetch(`${BASE}/cases/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /** Delete a case by ID. */
  deleteCase: (id) =>
    apiFetch(`${BASE}/cases/${id}/`, { method: 'DELETE' }),

  /**
   * Run the safety check on a case's medicine list.
   * If the case has a linked patient, their conditions + allergies are used as context.
   * Returns the safety report plus patient_context_used flag.
   */
  runSafetyCheck: (id) =>
    apiFetch(`${BASE}/cases/${id}/safety-check/`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};
