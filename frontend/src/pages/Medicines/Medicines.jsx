import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import MedicineSearch from '../../components/medicines/MedicineSearch';
import TimePickerModal from '../../components/common/TimePickerModal';
import { useLanguage } from '../../context/LanguageContext';
import './Medicines.css';

/**
 * Medicines Page Component (Route: /medicines)
 * Dedicated view displaying user's current medication cabinet, search bar, and state logic
 * for loading skeleton, empty state, and active medicine list.
 */
export const Medicines = ({ currentUser, onUpdateProfile, isLoading = false }) => {
  const { t } = useLanguage();
  const initialMeds = currentUser?.regularMedicines || currentUser?.regular_medicines || [];
  const [medicineList, setMedicineList] = useState(initialMeds);
  const [newMedInput, setNewMedInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dosageInput, setDosageInput] = useState('');
  const [selectedReminderTime, setSelectedReminderTime] = useState(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  useEffect(() => {
    const userMeds = currentUser?.regularMedicines || currentUser?.regular_medicines || [];
    setMedicineList(userMeds);
  }, [currentUser?.regularMedicines, currentUser?.regular_medicines]);

  // Normalize list to array of string names
  const medicinesList = Array.isArray(medicineList) ? medicineList : [];
  const hasMedicines = medicinesList.length > 0;

  // Persist updated list to Django backend via profile API
  const saveUpdatedMedicines = async (newList) => {
    const cleanedNames = newList.map((item) => (typeof item === 'string' ? item : (item?.name || item?.rxnorm_name || ''))).filter(Boolean);
    setMedicineList(cleanedNames);

    if (onUpdateProfile) {
      setIsSaving(true);
      try {
        await onUpdateProfile({ regularMedicines: cleanedNames });
      } catch (err) {
        console.error('Failed to sync medicines with backend profile:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Add medicine from Search component
  const handleAddFromSearch = (resultItem) => {
    const medName = typeof resultItem === 'string' ? resultItem : (resultItem?.name || resultItem?.rxnorm_name);
    if (!medName) return;

    const exists = medicinesList.some((m) => {
      const existingName = typeof m === 'string' ? m : m?.name;
      return String(existingName || '').toLowerCase().trim() === String(medName).toLowerCase().trim();
    });

    if (!exists) {
      saveUpdatedMedicines([...medicinesList, medName]);
    }
  };

  // Add medicine from modal form
  const handleAddMedicineSubmit = (e) => {
    e.preventDefault();
    const trimmed = newMedInput.trim();
    if (!trimmed) return;

    const exists = medicinesList.some((m) => {
      const existingName = typeof m === 'string' ? m : m?.name;
      return String(existingName || '').toLowerCase().trim() === trimmed.toLowerCase();
    });

    if (!exists) {
      const newMed = selectedReminderTime
        ? { name: trimmed, reminderTime: selectedReminderTime }
        : trimmed;
      saveUpdatedMedicines([...medicinesList, newMed]);
    }

    setNewMedInput('');
    setDosageInput('');
    setSelectedReminderTime(null);
    setIsTimePickerOpen(false);
    setIsModalOpen(false);
  };

  // Remove medicine item from cabinet
  const handleRemoveMedicine = (targetItem) => {
    const targetName = typeof targetItem === 'string' ? targetItem : (targetItem?.name || targetItem?.rxnorm_name);
    const updated = medicinesList.filter((m) => {
      const mName = typeof m === 'string' ? m : (m?.name || m?.rxnorm_name);
      return String(mName || '').toLowerCase().trim() !== String(targetName || '').toLowerCase().trim();
    });
    saveUpdatedMedicines(updated);
  };

  return (
    <div className="medicines-page-container">
      {/* Page Header */}
      <div className="medicines-page-header">
        <div className="header-text-group">
          <h1 className="medicines-page-title">{t('myMedicines')}</h1>
          <p className="medicines-page-subtitle">
            {t('cabinetSubtitle')}
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
            + {t('addMedicineBtn')}
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
              <h2 className="cabinet-card-title">{t('cabinetTitle')}</h2>
              <p className="cabinet-card-subtitle">{t('activeMedCabinet')}</p>
            </div>
          </div>

          {!isLoading && (
            <span className="cabinet-count-tag">
              {isSaving ? t('savingStatusLabel') : `${medicinesList.length} ${medicinesList.length === 1 ? t('medicine') : t('medicines')}`}
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

        {/* 2. EMPTY STATE */}
        {!isLoading && !hasMedicines && (
          <div className="medicines-empty-state">
            <div className="empty-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              </svg>
            </div>
            <h3 className="empty-title">{t('noMedsAddedYet')}</h3>
            <p className="empty-subtext">
              {t('noMedicines')}
            </p>
            <Button
              type="button"
              variant="primary"
              size="medium"
              onClick={() => setIsModalOpen(true)}
            >
              + {t('addMedicineBtn')}
            </Button>
          </div>
        )}

        {/* 3. HAS MEDICINES STATE */}
        {!isLoading && hasMedicines && (
          <ul className="medicines-page-list">
            {medicinesList.map((med, index) => {
              const keyName = typeof med === 'string' ? med : (med?.name || `med-${index}`);
              return (
                <MedicineListItem
                  key={`${keyName}-${index}`}
                  medicine={med}
                  onRemove={handleRemoveMedicine}
                />
              );
            })}
          </ul>
        )}
      </div>

      {/* Add Medicine Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="add-medicine-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('addMedicineBtn')}</h3>
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
                  {t('drugNameLabel')}
                </label>
                <input
                  id="medNameInput"
                  type="text"
                  className="form-input"
                  placeholder={t('regularMedsPlaceholder')}
                  value={newMedInput}
                  onChange={(e) => setNewMedInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="medDosageInput" className="form-label">
                  Dosage <span className="label-optional">(Optional)</span>
                </label>
                <input
                  id="medDosageInput"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 500mg, 1 tablet daily"
                  value={dosageInput}
                  onChange={(e) => setDosageInput(e.target.value)}
                />
              </div>

              <div className="form-group reminder-time-group">
                <div className="reminder-time-header">
                  <span className="form-label">{t('reminderTimeLabel')}</span>
                  <button
                    type="button"
                    className={`add-time-btn ${selectedReminderTime ? 'time-set' : ''}`}
                    onClick={() => setIsTimePickerOpen(true)}
                    aria-label={selectedReminderTime ? `Edit reminder time ${selectedReminderTime}` : t('addTimeBtn')}
                  >
                    {selectedReminderTime ? `⏰ ${selectedReminderTime}` : t('addTimeBtn')}
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t('cancelBtn')}
                </button>
                <Button type="submit" variant="primary" size="medium">
                  {t('saveMedicine')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock-Style Time Picker Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        initialTime={selectedReminderTime}
        onConfirm={(formattedTime) => {
          setSelectedReminderTime(formattedTime);
          setIsTimePickerOpen(false);
        }}
        onCancel={() => {
          setIsTimePickerOpen(false);
        }}
      />
    </div>
  );
};


export default Medicines;

