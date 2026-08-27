import React from 'react';
import Button from '../common/Button';
import './SafetyStatusCard.css';

/**
 * SafetyStatusCard Component
 * Displays prominent medication safety status with warning count and Check Safety CTA.
 * Gracefully handles missing/null data without crashing.
 */
export const SafetyStatusCard = ({ data, lastCheck, onNavigate }) => {
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
    mainValue = 'All Clear',
    supportingText = 'No active medication interactions identified.',
    lastChecked = 'Today',
    hasWarnings = false,
  } = data;

  // Medicines from last local history check
  const lastMeds = lastCheck?.medicines || [];
  const lastDate = lastCheck ? `${lastCheck.date}${lastCheck.time ? ' · ' + lastCheck.time : ''}` : null;
  const lastStatus = lastCheck?.status || null;
  const lastIntCount = lastCheck?.interactionsCount ?? null;

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

      {/* ── Last safety check detail panel ─────────────────────────────── */}
      {lastCheck && lastMeds.length > 0 && (
        <div className="ssc-last-check-panel">
          <div className="ssc-last-check-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
            </svg>
            <span className="ssc-last-check-label">Last check</span>
            {lastDate && <span className="ssc-last-check-date">{lastDate}</span>}
            {lastStatus && (
              <span className={`ssc-last-check-status ${lastStatus === 'Safe' ? 'ssc-status--safe' : 'ssc-status--attention'}`}>
                {lastStatus}
              </span>
            )}
          </div>
          <div className="ssc-last-check-meds">
            {lastMeds.slice(0, 4).map((med, idx) => (
              <span key={idx} className="ssc-med-pill">
                {typeof med === 'string' ? med : (med?.name || med?.rxnorm_name || '')}
              </span>
            ))}
            {lastMeds.length > 4 && (
              <span className="ssc-med-pill ssc-med-pill--more">+{lastMeds.length - 4} more</span>
            )}
          </div>
          {lastIntCount !== null && (
            <p className="ssc-last-check-note">
              {lastIntCount === 0
                ? 'No interactions were identified in this check.'
                : `${lastIntCount} interaction${lastIntCount !== 1 ? 's' : ''} identified — view history for details.`}
            </p>
          )}
        </div>
      )}

      {!lastCheck && (
        <p className="ssc-no-history-note">
          No previous safety checks found. Run your first check below.
        </p>
      )}

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
