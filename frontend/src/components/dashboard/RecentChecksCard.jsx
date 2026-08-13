import React from 'react';
import './RecentChecksCard.css';

/**
 * RecentChecksCard Component
 * Displays history list of recent interaction screenings.
 * Supports empty state handling and graceful null/undefined resilience.
 */
export const RecentChecksCard = ({ checks = [], onNavigate, isError = false }) => {
  if (isError) {
    return (
      <div className="dashboard-card recent-checks-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <div className="card-icon-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <h2 className="card-title">Recent Safety Checks</h2>
            </div>
          </div>
        </div>
        <div className="empty-state-box">
          <p className="empty-state-text">Unable to load recent checks.</p>
        </div>
      </div>
    );
  }

  const checksList = Array.isArray(checks) ? checks : [];
  const hasChecks = checksList.length > 0;

  return (
    <div className="dashboard-card recent-checks-card">
      <div className="card-header-row">
        <div className="card-title-group">
          <div className="card-icon-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <h2 className="card-title">Recent Safety Checks</h2>
            <p className="card-subtitle">Interaction screening history</p>
          </div>
        </div>

        {hasChecks && (
          <button
            type="button"
            className="view-all-link-btn"
            onClick={() => onNavigate && onNavigate('/history')}
          >
            <span>View All</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* History List or Empty State */}
      {hasChecks ? (
        <ul className="history-list">
          {checksList.map((item, index) => {
            const itemKey = item?.id || `check-${index}`;
            const dateStr = item?.date || 'Recent';
            const medCount = item?.medicineCount ? `${item.medicineCount} medicines checked` : 'Medicines checked';
            const statusStr = item?.status || 'Completed';
            const variantClass = item?.variant || 'safe';

            return (
              <li key={itemKey} className="history-item">
                <div className="history-info">
                  <span className="history-date">{dateStr}</span>
                  <span className="history-details">{medCount}</span>
                </div>

                <span className={`status-badge status-${variantClass}`}>
                  {statusStr}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state-box">
          <p className="empty-state-text">No safety checks yet.</p>
          <button
            type="button"
            className="empty-state-btn"
            onClick={() => onNavigate && onNavigate('/safety-check')}
          >
            Start a safety check
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentChecksCard;
