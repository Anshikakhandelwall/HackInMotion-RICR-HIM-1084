import React from 'react';
import MedicineListItem from '../medicines/MedicineListItem';
import './MedicineSummaryCard.css';

/**
 * MedicineSummaryCard Component
 * Displays user's current medicine list summary with dynamic count, loading skeleton, error state, and empty state.
 */
export const MedicineSummaryCard = ({
  medicines = [],
  isLoading = false,
  isError = false,
  onRetry,
  onNavigate,
}) => {
  // Defensive normalization of medicines array
  const medicinesList = Array.isArray(medicines) ? medicines : [];
  const hasMedicines = medicinesList.length > 0;

  return (
    <div className="dashboard-card medicine-summary-card">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="card-icon-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
          </div>
          <div>
            <h2 className="card-title">Current Medicines</h2>
            <p className="card-subtitle">Active medication cabinet</p>
          </div>
        </div>

        {!isLoading && !isError && hasMedicines && (
          <span className="medicine-count-badge">
            {medicinesList.length} {medicinesList.length === 1 ? 'medicine' : 'medicines'}
          </span>
        )}
      </div>

      {/* 1. Loading State */}
      {isLoading && (
        <div className="medicine-skeleton-list">
          <div className="skeleton-item" />
          <div className="skeleton-item" />
          <div className="skeleton-item" />
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && isError && (
        <div className="medicine-error-box">
          <p className="medicine-error-text">Unable to load your medicines.</p>
          {onRetry && (
            <button type="button" className="medicine-retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && !hasMedicines && (
        <div className="empty-state-box">
          <p className="empty-state-title">No medicines added yet.</p>
          <p className="empty-state-supporting-text">
            Add your current medicines to keep your medication profile up to date.
          </p>
          <button
            type="button"
            className="empty-state-btn"
            onClick={() => onNavigate && onNavigate('/medicines')}
          >
            Add Medicine
          </button>
        </div>
      )}

      {/* 4. Active Medicines List */}
      {!isLoading && !isError && hasMedicines && (
        <ul className="medicine-list">
          {medicinesList.map((med, index) => {
            const medKey = (med && med.id) || `mock-${index}`;
            return <MedicineListItem key={medKey} medicine={med} />;
          })}
        </ul>
      )}

      {/* Footer Add Medicine Action */}
      {!isLoading && !isError && hasMedicines && (
        <div className="card-footer-action">
          <button
            type="button"
            className="add-medicine-link-btn"
            onClick={() => onNavigate && onNavigate('/medicines')}
          >
            <span>+ Add Medicine</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicineSummaryCard;
