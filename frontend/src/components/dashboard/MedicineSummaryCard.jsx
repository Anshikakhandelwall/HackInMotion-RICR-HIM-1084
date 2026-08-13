import React from 'react';
import './MedicineSummaryCard.css';

/**
 * MedicineSummaryCard Component
 * Displays user's current medicine list summary with count and Add Medicine CTA.
 */
export const MedicineSummaryCard = ({ currentUser, onNavigate }) => {
  // Use saved regular medicines if present, otherwise realistic mock entries
  const userMeds = currentUser?.regularMedicines || currentUser?.regular_medicines;

  const medicinesList = (userMeds && userMeds.length > 0)
    ? userMeds.map((med, idx) => ({ id: idx, name: med, dosage: 'Active Prescription', schedule: 'Daily' }))
    : [
        { id: 1, name: 'Paracetamol', dosage: '500mg', schedule: 'As needed for fever' },
        { id: 2, name: 'Metformin', dosage: '800mg', schedule: 'Twice daily with meals' },
        { id: 3, name: 'Amlodipine', dosage: '5mg', schedule: 'Once daily (Morning)' },
      ];

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

        <span className="medicine-count-badge">{medicinesList.length} medicines</span>
      </div>

      {/* Medicines List */}
      <ul className="medicine-list">
        {medicinesList.map((med) => (
          <li key={med.id} className="medicine-item">
            <div className="medicine-icon-circle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
              </svg>
            </div>
            <div className="medicine-info">
              <span className="medicine-name">{med.name}</span>
              <span className="medicine-dosage">{med.dosage} • {med.schedule}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer Add Medicine CTA */}
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
    </div>
  );
};

export default MedicineSummaryCard;
