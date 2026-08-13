import React from 'react';
import './MedicineListItem.css';

/**
 * MedicineListItem Component
 * Reusable row item rendering a medicine entry with a clean icon and defensive name handling.
 */
export const MedicineListItem = ({ medicine, className = '' }) => {
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
      <div className="medicine-item-details">
        <span className="medicine-item-name">{name}</span>
      </div>
    </li>
  );
};

export default MedicineListItem;
