/**
 * History Service Module
 * Manages client-side safety check history pipeline and localStorage persistence.
 */

const STORAGE_KEY = 'mediguard_safety_history';

/**
 * Fetch all saved safety check history records.
 * @returns {Array<Object>}
 */
export const getHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read safety check history from storage:', err);
    return [];
  }
};

/**
 * Save a new safety check run record to history.
 * @param {Object} record
 * @returns {Array<Object>} Updated history array
 */
export const saveHistoryRecord = (record) => {
  if (!record) return getHistory();

  try {
    const existing = getHistory();

    const formattedRecord = {
      id: record.id || `check-${Date.now()}`,
      date: record.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: record.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      timestamp: record.timestamp || Date.now(),
      medicinesCount: record.medicinesCount || (record.medicines ? record.medicines.length : 0),
      interactionsCount: record.interactionsCount !== undefined ? record.interactionsCount : (record.interactions ? record.interactions.length : 0),
      status: record.status || (record.interactionsCount > 0 ? 'Attention Required' : 'Safe'),
      variant: record.variant || (record.status === 'Safe' ? 'safe' : 'attention'),
      medicines: record.medicines || [],
      interactions: record.interactions || [],
    };

    // Prepend new record, keep up to 50 recent items
    const updated = [formattedRecord, ...existing.filter((item) => item.id !== formattedRecord.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Notify application components of updated history
    window.dispatchEvent(new CustomEvent('mediguard:history_updated', { detail: updated }));

    return updated;
  } catch (err) {
    console.error('Failed to save safety check history record:', err);
    return getHistory();
  }
};

/**
 * Get a specific history record by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export const getHistoryById = (id) => {
  const history = getHistory();
  return history.find((record) => record.id === id) || null;
};

/**
 * Clear all safety check history records.
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('mediguard:history_updated', { detail: [] }));
  } catch (err) {
    console.error('Failed to clear safety check history:', err);
  }
};

export default {
  getHistory,
  saveHistoryRecord,
  getHistoryById,
  clearHistory,
};
