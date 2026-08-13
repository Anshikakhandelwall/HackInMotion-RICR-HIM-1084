import React from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import mockMedicines from '../../data/mockMedicines';
import './SafetyCheck.css';

// Centralised mock data for summary counts
// Easy to replace with API payloads in future commits
const mockSummaryData = {
  severe: 1,
  moderate: 1,
  safe: 1,
};

/**
 * SafetyCheck Page Component (Route: /safety-check)
 * Implements base Safety Check page and the Safety Status Summary.
 * - Displays active daily medicines of the user.
 * - Renders a Safety Status Summary box (Severe, Moderate, Safe categories).
 * - Dynamically states an overall warning message based on mock counts.
 */
export const SafetyCheck = ({ currentUser, onNavigate }) => {
  // Extract user's active medicines or fall back to mockMedicines
  const activeMedicines = (currentUser?.regularMedicines && currentUser.regularMedicines.length > 0)
    ? currentUser.regularMedicines
    : (currentUser?.regular_medicines && currentUser.regular_medicines.length > 0)
    ? currentUser.regular_medicines
    : mockMedicines;

  const handleCheckMedicines = () => {
    console.log('[SafetyCheck] Check My Medicines action triggered');
  };

  // Derive dynamic overall message based on summary data
  const getOverallMessage = (summary) => {
    if (summary.severe > 0) {
      return `${summary.severe} severe interaction${summary.severe === 1 ? '' : 's'} require${summary.severe === 1 ? 's' : ''} your attention. Please review your safety results.`;
    } else if (summary.moderate > 0) {
      return `${summary.moderate} moderate interaction${summary.moderate === 1 ? '' : 's'} identified. Review details for safety advice.`;
    } else {
      return `All checked medicines are safe. No interactions found.`;
    }
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

      {/* 5. Safety Status Summary Section */}
      <div className="safety-check-summary-section">
        <div className="safety-summary-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h2 className="safety-summary-title">Safety Status Summary</h2>
        </div>

        {/* Three Grid Categories */}
        <div className="safety-summary-cards-container">
          {/* Card A: Severe */}
          <div className="status-card status-card-severe">
            <div className="status-card-header">
              <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🔴</span>
              <span className="status-card-label">Severe</span>
            </div>
            <span className="status-card-count">{mockSummaryData.severe}</span>
          </div>

          {/* Card B: Moderate */}
          <div className="status-card status-card-moderate">
            <div className="status-card-header">
              <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟠</span>
              <span className="status-card-label">Moderate</span>
            </div>
            <span className="status-card-count">{mockSummaryData.moderate}</span>
          </div>

          {/* Card C: Safe */}
          <div className="status-card status-card-safe">
            <div className="status-card-header">
              <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟢</span>
              <span className="status-card-label">Safe</span>
            </div>
            <span className="status-card-count">{mockSummaryData.safe}</span>
          </div>
        </div>

        {/* Overall dynamic status notice box */}
        <div className="safety-message-container">
          <div className="safety-message-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <span className="safety-message-text">{getOverallMessage(mockSummaryData)}</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyCheck;
