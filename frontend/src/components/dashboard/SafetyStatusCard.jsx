import React from 'react';
import Button from '../common/Button';
import './SafetyStatusCard.css';

/**
 * SafetyStatusCard Component
 * Displays prominent medication safety status with warning count and Check Safety CTA.
 */
export const SafetyStatusCard = ({ onNavigate }) => {
  return (
    <div className="dashboard-card safety-status-card">
      <div className="safety-card-header">
        <div className="safety-badge-header">
          <div className="safety-shield-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <div>
            <span className="last-checked-tag">Last checked: Today, 10:30 AM</span>
            <h2 className="safety-title">Medication Risk Assessment</h2>
          </div>
        </div>

        <span className="warning-pill-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          2 Active Warnings
        </span>
      </div>

      <p className="safety-description">
        We found potential interaction risks between your current medications that require review. Check symptoms, DDInter verified evidence, and recommended next steps.
      </p>

      <div className="safety-action-row">
        <Button
          type="button"
          variant="primary"
          size="medium"
          fullWidth
          onClick={() => onNavigate && onNavigate('/safety-check')}
        >
          Check Safety
        </Button>
      </div>
    </div>
  );
};

export default SafetyStatusCard;
