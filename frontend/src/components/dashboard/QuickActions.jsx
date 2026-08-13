import React from 'react';
import './QuickActions.css';

/**
 * QuickActions Component
 * Minimal quick action bar for rapid navigation to core features.
 */
export const QuickActions = ({ onNavigate }) => {
  const actions = [
    {
      id: '/medicines',
      label: 'Add Medicine',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      id: '/safety-check',
      label: 'Check Safety',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: '/history',
      label: 'View History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <div className="quick-actions-container">
      <h3 className="quick-actions-title">Quick Actions</h3>
      <div className="quick-actions-list">
        {actions.map((act) => (
          <button
            key={act.id}
            type="button"
            className="quick-action-btn"
            onClick={() => onNavigate && onNavigate(act.id)}
          >
            <span className="quick-action-icon">{act.icon}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
