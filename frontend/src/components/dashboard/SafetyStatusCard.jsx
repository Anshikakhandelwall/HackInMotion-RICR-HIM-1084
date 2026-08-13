import React from 'react';
import Button from '../common/Button';
import './SafetyStatusCard.css';

/**
 * SafetyStatusCard Component
 * Displays prominent medication safety status with warning count and Check Safety CTA.
 * Gracefully handles missing/null data without crashing.
 */
export const SafetyStatusCard = ({ data, onNavigate }) => {
  // Graceful fallback for missing/null data
  if (!data) {
    return (
      <div className="dashboard-card safety-status-card safety-unavailable">
        <div className="safety-card-header">
          <div className="safety-badge-header">
            <div className="safety-shield-icon neutral-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="safety-title">Safety Overview</h2>
              <span className="last-checked-tag">Safety status unavailable</span>
            </div>
          </div>
        </div>
        <p className="safety-description">
          Run a safety screening to evaluate potential drug-drug interaction risks across your medication list.
        </p>
        <div className="safety-action-row">
          <Button
            type="button"
            variant="primary"
            size="medium"
            fullWidth
            onClick={() => onNavigate && onNavigate('/safety-check')}
          >
            Start Safety Check
          </Button>
        </div>
      </div>
    );
  }

  const {
    title = 'Safety Overview',
    mainValue = '2 Active Warnings',
    supportingText = 'Potential medication interactions need your attention.',
    lastChecked = 'Today, 10:30 AM',
    hasWarnings = true,
  } = data;

  return (
    <div className="dashboard-card safety-status-card">
      <div className="safety-card-header">
        <div className="safety-badge-header">
          <div className={`safety-shield-icon ${hasWarnings ? 'warning-icon' : 'safe-icon'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              {hasWarnings ? (
                <>
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </>
              ) : (
                <path d="m9 12 2 2 4-4" />
              )}
            </svg>
          </div>
          <div>
            <span className="last-checked-tag">Last checked: {lastChecked}</span>
            <h2 className="safety-title">{title}</h2>
          </div>
        </div>

        <span className={`warning-pill-badge ${hasWarnings ? 'badge-warning' : 'badge-safe'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {mainValue}
        </span>
      </div>

      <p className="safety-description">{supportingText}</p>

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
