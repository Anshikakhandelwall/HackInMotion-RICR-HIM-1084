import React, { useState } from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import MedicineSearch from '../../components/medicines/MedicineSearch';
import { mockMedicines } from '../../data/mockMedicines';
import './Medicines.css';

/**
 * Medicines Page Component (Route: /medicines)
 * Dedicated view displaying user's current medication cabinet, search bar, and state logic
 * for loading skeleton, empty state, and active medicine list.
 */
export const Medicines = ({ isLoading = false, medicines = mockMedicines, onNavigate }) => {
  const [medicineList, setMedicineList] = useState(medicines || []);
  const [newMedInput, setNewMedInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Defensive array normalization (handles null, undefined, or empty arrays)
  const medicinesList = Array.isArray(medicineList) ? medicineList : [];
  const hasMedicines = medicinesList.length > 0;

  // Add medicine from Search component
  const handleAddFromSearch = (resultItem) => {
    const medName = typeof resultItem === 'string' ? resultItem : resultItem?.name;
    if (!medName) return;

    const newItem = {
      id: resultItem?.id || `search-${Date.now()}`,
      name: medName,
    };

    setMedicineList((prev) => [...(Array.isArray(prev) ? prev : []), newItem]);
  };

  // Add medicine from modal form
  const handleAddMedicineSubmit = (e) => {
    e.preventDefault();
    if (!newMedInput.trim()) return;

    const newItem = {
      id: `mock-${Date.now()}`,
      name: newMedInput.trim(),
    };

    setMedicineList((prev) => [...(Array.isArray(prev) ? prev : []), newItem]);
    setNewMedInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="medicines-page-container">
      {/* Page Header */}
      <div className="medicines-page-header">
        <div className="header-text-group">
          <h1 className="medicines-page-title">My Medicines</h1>
          <p className="medicines-page-subtitle">
            Keep track of the medicines you&apos;re currently taking.
          </p>
        </div>

        {/* Action Row: Search bar & Add Medicine button */}
        <div className="header-action-row">
          <MedicineSearch
            currentMedicines={medicinesList}
            onAddMedicine={handleAddFromSearch}
          />
          <Button
            type="button"
            variant="primary"
            size="medium"
            className="add-med-primary-btn"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Medicine
          </Button>
        </div>
      </div>

      {/* Main Cabinet Card */}
      <div className="medicines-cabinet-card">
        <div className="cabinet-card-header">
          <div className="cabinet-title-group">
            <div className="cabinet-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </div>
            <div>
              <h2 className="cabinet-card-title">Medication Cabinet</h2>
              <p className="cabinet-card-subtitle">Active daily prescriptions & supplements</p>
            </div>
          </div>

          {!isLoading && hasMedicines && (
            <span className="cabinet-count-tag">
              {medicinesList.length} {medicinesList.length === 1 ? 'medicine' : 'medicines'}
            </span>
          )}
        </div>

        {/* --- STATE LOGIC --- */}
        {/* 1. LOADING STATE */}
        {isLoading && (
          <div className="medicines-skeleton-list">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        )}

        {/* 2. EMPTY STATE (loading === false && medicines.length === 0) */}
        {!isLoading && !hasMedicines && (
          <div className="medicines-empty-state">
            <div className="empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              </svg>
            </div>
            <h3 className="empty-title">No medicines added yet</h3>
            <p className="empty-subtext">
              Add your current medicines to keep track of them in MediGuard.
            </p>
            <Button
              type="button"
              variant="primary"
              size="medium"
              onClick={() => setIsModalOpen(true)}
            >
              + Add Medicine
            </Button>
          </div>
        )}

        {/* 3. HAS MEDICINES STATE (loading === false && medicines.length > 0) */}
        {!isLoading && hasMedicines && (
          <ul className="medicines-page-list">
            {medicinesList.map((med) => (
              <MedicineListItem key={med?.id || med?.name} medicine={med} />
            ))}
          </ul>
        )}
      </div>

      {/* Frontend Demo Add Medicine Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="add-medicine-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Medicine</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="medNameInput" className="form-label">
                  Medicine Name
                </label>
                <input
                  id="medNameInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paracetamol"
                  value={newMedInput}
                  onChange={(e) => setNewMedInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="demo-notice-box">
                ℹ️ <strong>Demo Mode:</strong> Newly added medicines persist locally in state. Connect backend API to save to database.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="medium">
                  Save Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
