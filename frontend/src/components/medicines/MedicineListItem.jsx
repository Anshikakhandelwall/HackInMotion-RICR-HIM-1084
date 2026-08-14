import React from 'react';
import './MedicineListItem.css';

/**
 * MedicineListItem Component
 * Reusable row item rendering a medicine entry with a clean icon and defensive name handling.
 */
export const MedicineListItem = ({ medicine, onRemove, className = '' }) => {
  // Defensive extraction of medicine name
  const name = typeof medicine === 'string'
    ? medicine
    : (medicine && typeof medicine.name === 'string' && medicine.name.trim().length > 0)
    ? medicine.name
    : 'Unknown medicine';

  return (
    <li className={`medicine-list-item ${className}`}>
      <div className="medicine-item-icon-circle" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      </div>
      <div className="medicine-item-details" style={{ flex: 1 }}>
        <span className="medicine-item-name">{name}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          className="medicine-item-remove-btn"
          title={`Remove ${name}`}
          onClick={() => onRemove(medicine)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '0.3rem',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '0.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </li>
  );
};

export default MedicineListItem;

