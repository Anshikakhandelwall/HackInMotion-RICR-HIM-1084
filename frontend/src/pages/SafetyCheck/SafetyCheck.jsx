import React from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import mockMedicines from '../../data/mockMedicines';
import './SafetyCheck.css';

/**
 * SafetyCheck Page Component (Route: /safety-check)
 * Implements the base UI/layout for drug-drug interaction safety checking.
 * - Displays active medicines that are currently in the medication cabinet (consumes existing frontend state).
 * - Implements a clear central screen and a primary CTA "Check My Medicines" button.
 * - Restricts interaction processing to mock visual click logging for this commit.
 */
export const SafetyCheck = ({ currentUser, onNavigate }) => {
  // Extract user's active medicines or fall back to mockMedicines if empty/missing
  const activeMedicines = (currentUser?.regularMedicines && currentUser.regularMedicines.length > 0)
    ? currentUser.regularMedicines
    : (currentUser?.regular_medicines && currentUser.regular_medicines.length > 0)
    ? currentUser.regular_medicines
    : mockMedicines;

  const handleCheckMedicines = () => {
    console.log('[SafetyCheck] Check My Medicines action triggered');
  };

  return (
    <div className="safety-check-page-container">
      {/* 1. Page Title & Description */}
      <div className="safety-check-page-header">
        <h1 className="safety-check-page-title">Safety Check</h1>
        <p className="safety-check-page-subtitle">
          Screen your current medication cabinet for potential drug-drug interactions.
        </p>
      </div>

      {/* 2. Main Screening Cabinet Card */}
      <div className="safety-check-card">
        <div className="safety-check-card-header">
          <div className="safety-check-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="safety-check-card-title">Medication Screening Cabinet</h2>
            <p className="safety-check-card-subtitle">Preview list of medicines that will be checked for safety risks</p>
          </div>
        </div>

        {/* 3. Medicine Preview List Section */}
        <div className="safety-check-preview-content">
          <p className="safety-check-preview-hint">
            The screening check will run against the DDInter 2.0 interaction database.
          </p>

          <ul className="safety-check-preview-list">
            {activeMedicines.map((med, index) => {
              const key = typeof med === 'string' ? `med-${index}` : (med?.id || `mock-${index}`);
              return (
                <MedicineListItem 
                  key={key} 
                  medicine={med} 
                  className="safety-check-preview-item"
                />
              );
            })}
          </ul>
        </div>

        {/* 4. Action Button Footer */}
        <div className="safety-check-card-footer">
          <Button
            type="button"
            variant="primary"
            size="medium"
            className="check-medicines-btn"
            onClick={handleCheckMedicines}
          >
            Check My Medicines
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SafetyCheck;
