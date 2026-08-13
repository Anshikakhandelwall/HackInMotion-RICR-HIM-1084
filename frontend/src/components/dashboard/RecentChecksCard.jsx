import React from 'react';
import './RecentChecksCard.css';

/**
 * RecentChecksCard Component
 * Displays history list of recent interaction screenings.
 */
export const RecentChecksCard = ({ onNavigate }) => {
  const recentChecksList = [
    {
      id: 1,
      date: '13 Aug 2026',
      details: '3 medicines checked (Paracetamol, Metformin, Amlodipine)',
      status: '1 Severe',
      variant: 'severe',
    },
    {
      id: 2,
      date: '10 Aug 2026',
      details: '2 medicines checked (Metformin, Aspirin)',
      status: '1 Moderate',
      variant: 'moderate',
    },
    {
      id: 3,
      date: '08 Aug 2026',
      details: '4 medicines checked (Paracetamol, Vitamin D3, B12, Zinc)',
      status: 'No interactions found',
      variant: 'safe',
    },
  ];

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
            <h2 className="card-title">Recent Checks</h2>
            <p className="card-subtitle">Interaction screening history</p>
          </div>
        </div>

        <button
          type="button"
          className="view-all-link-btn"
          onClick={() => onNavigate && onNavigate('/history')}
        >
          <span>View all</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* History List */}
      <ul className="history-list">
        {recentChecksList.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-info">
              <span className="history-date">{item.date}</span>
              <span className="history-details">{item.details}</span>
            </div>

            <span className={`status-badge status-${item.variant}`}>
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentChecksCard;
