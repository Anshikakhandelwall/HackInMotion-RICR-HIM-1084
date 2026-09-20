/**
 * Caregiver service — authenticated calls to /api/rbac/caregiver/ endpoints.
 */
import { apiFetch } from '../api/apiClient';

const BASE = '/api/rbac/caregiver';

export const caregiverService = {
  /** Generate a new connection invite code (caregiver only). */
  generateCode: () =>
    apiFetch(`${BASE}/generate-code/`, { method: 'POST', body: JSON.stringify({}) }),

  /** Patient approves a connection using the code shared by the caregiver. */
  approveConnection: (connection_code) =>
    apiFetch(`${BASE}/approve-connection/`, {
      method: 'POST',
      body: JSON.stringify({ connection_code }),
    }),

  /** List all approved patient connections for the authenticated caregiver. */
  getConnections: () => apiFetch(`${BASE}/connections/`),

  /** Remove a patient connection by connection ID. */
  removeConnection: (connectionId) =>
    apiFetch(`${BASE}/connections/${connectionId}/`, { method: 'DELETE' }),

  /** Get a connected patient's full health profile (caregiver only). */
  getPatientProfile: (patientId) => apiFetch(`${BASE}/patient/${patientId}/profile/`),

  /**
   * Run a safety check for a connected patient.
   * Uses the patient's own medicines, conditions and allergies as context.
   * Optionally supply an override medicine list in `medicines`.
   */
  runPatientSafetyCheck: (patientId, medicines = null) =>
    apiFetch(`${BASE}/patient/${patientId}/safety-check/`, {
      method: 'POST',
      body: JSON.stringify(medicines ? { medicines } : {}),
    }),

  /**
   * Update a connected patient's regular medicines list.
   * @param {number} patientId
   * @param {string[]} medicines
   */
  updatePatientMedicines: (patientId, medicines) =>
    apiFetch(`${BASE}/patient/${patientId}/medicines/`, {
      method: 'PATCH',
      body: JSON.stringify({ regular_medicines: medicines }),
    }),

  // ── Patient-side: manage caregivers who have access ────────────────────────

  /** Patient: list all approved caregivers who have access to their profile. */
  getMyCaregivers: () => apiFetch('/api/rbac/patient/caregivers/'),

  /** Patient: revoke a specific caregiver's access by connection ID. */
  revokeCaregiverAccess: (connectionId) =>
    apiFetch(`/api/rbac/patient/caregivers/${connectionId}/`, { method: 'DELETE' }),
};
