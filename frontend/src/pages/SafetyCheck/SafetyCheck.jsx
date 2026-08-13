import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import mockMedicines from '../../data/mockMedicines';
import './SafetyCheck.css';

// Centralised mock data for summary counts
// Easy to replace with API payloads in future commits
const mockSummaryData = {
  severe: 1,
  moderate: 1,
  safe: 1,
};

// Reusable severity indicator configurations
const SEVERITY_CONFIG = {
  severe: {
    label: 'Severe',
    colorClass: 'severe',
    badgeClass: 'severity-severe-badge',
    icon: '🔴',
    colorHex: 'var(--color-error)',
  },
  moderate: {
    label: 'Moderate',
    colorClass: 'moderate',
    badgeClass: 'severity-moderate-badge',
    icon: '🟠',
    colorHex: '#E27E36',
  },
  safe: {
    label: 'Safe',
    colorClass: 'safe',
    badgeClass: 'severity-safe-badge',
    icon: '🟢',
    colorHex: 'var(--color-success)',
  },
  fallback: {
    label: 'Unknown Risk',
    colorClass: 'unknown',
    badgeClass: 'severity-unknown-badge',
    icon: '⚪',
    colorHex: '#A3A3A3',
  }
};

const getSeverityConfig = (severity) => {
  if (!severity) return SEVERITY_CONFIG.fallback;
  const key = severity.toLowerCase();
  return SEVERITY_CONFIG[key] || SEVERITY_CONFIG.fallback;
};

// Centralised mock data for interaction cards
const mockInteractions = [
  {
    id: 1,
    drugA: 'Warfarin',
    drugB: 'Aspirin',
    severity: 'Severe',
    description: 'Increased risk of bleeding.',
  },
  {
    id: 2,
    drugA: 'Amlodipine',
    drugB: 'Simvastatin',
    severity: 'Moderate',
    description: 'Simvastatin may increase the blood levels of Amlodipine.',
  },
  {
    id: 3,
    drugA: 'Amoxicillin',
    drugB: 'Ibuprofen',
    severity: 'Safe',
    description: 'No known drug-drug interactions found.',
  },
  {
    id: 4,
    drugA: 'UnknownDrugA',
    drugB: 'UnknownDrugB',
    severity: 'Unknown',
    description: 'Insufficient interaction evidence available.',
  },
];

/**
 * SafetyCheck Page Component (Route: /safety-check)
 * Implements base Safety Check page, Safety Status Summary, and Interaction Result Cards.
 * - Displays active daily medicines of the user.
 * - Renders a Safety Status Summary box (Severe, Moderate, Safe categories).
 * - Displays individual medication interaction cards under the section "Interactions Found".
 * - Dynamically states an overall warning message based on mock counts.
 */
export const SafetyCheck = ({ currentUser, onNavigate, onViewDetails }) => {
  // Extract user's active medicines or fall back to mockMedicines
  const activeMedicines = (currentUser?.regularMedicines && currentUser.regularMedicines.length > 0)
    ? currentUser.regularMedicines
    : (currentUser?.regular_medicines && currentUser.regular_medicines.length > 0)
    ? currentUser.regular_medicines
    : mockMedicines;

  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState(mockInteractions);

  // Helper to dynamically calculate summary counts
  const getSummaryCounts = (items) => {
    const counts = { severe: 0, moderate: 0, safe: 0 };
    items.forEach((item) => {
      const sev = item.severity.toLowerCase();
      if (sev === 'severe') counts.severe++;
      else if (sev === 'moderate') counts.moderate++;
      else if (sev === 'safe') counts.safe++;
    });
    return counts;
  };

  const summaryData = getSummaryCounts(interactions);

  // For testing purposes via browser subagent or url parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceState = params.get('safetyState');
    if (forceState === 'loading') {
      setLoading(true);
    } else if (forceState === 'empty') {
      setInteractions([]);
    }
  }, []);

  const handleCheckMedicines = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // If cabinet has no medicines (empty array), render empty state
      const cabinetMeds = currentUser?.regularMedicines || currentUser?.regular_medicines || [];
      if (cabinetMeds.length === 0) {
        setInteractions([]);
      } else {
        setInteractions(mockInteractions);
      }
    }, 1000);
  };

  // Derive dynamic overall message based on summary data
  const getOverallMessage = (summary) => {
    if (summary.severe > 0) {
      return `${summary.severe} severe interaction${summary.severe === 1 ? '' : 's'} require${summary.severe === 1 ? 's' : ''} your attention. Please review your safety results.`;
    } else if (summary.moderate > 0) {
      return `${summary.moderate} moderate interaction${summary.moderate === 1 ? '' : 's'} identified. Review details for safety advice.`;
    } else {
      return `All checked medicines are safe. No interactions found.`;
    }
  };

  return (
    <div className="safety-check-page-container">
      {/* 1. Page Title & Description */}
      <div className="safety-check-page-header">
        <h1 className="safety-check-page-title">Safety Check</h1>
        <p className="safety-check-page-subtitle">
          Screen your current medication cabinet for potential drug-drug interactions.
        </p>
      </div>

      {/* 2. Main Screening Cabinet Card */}
      <div className="safety-check-card">
        <div className="safety-check-card-header">
          <div className="safety-check-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="safety-check-card-title">Medication Screening Cabinet</h2>
            <p className="safety-check-card-subtitle">Preview list of medicines that will be checked for safety risks</p>
          </div>
        </div>

        {/* 3. Medicine Preview List Section */}
        <div className="safety-check-preview-content">
          <p className="safety-check-preview-hint">
            The screening check will run against the DDInter 2.0 interaction database.
          </p>

          <ul className="safety-check-preview-list">
            {activeMedicines.map((med, index) => {
              const key = typeof med === 'string' ? `med-${index}` : (med?.id || `mock-${index}`);
              return (
                <MedicineListItem 
                  key={key} 
                  medicine={med} 
                  className="safety-check-preview-item"
                />
              );
            })}
          </ul>
        </div>

        {/* 4. Action Button Footer */}
        <div className="safety-check-card-footer">
          <Button
            type="button"
            variant="primary"
            size="medium"
            className="check-medicines-btn"
            onClick={handleCheckMedicines}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check My Medicines'}
          </Button>
        </div>
      </div>

      {/* 5. Results Area Rendering */}
      {loading ? (
        <div className="safety-loading-container" aria-busy="true">
          <div className="safety-loading-spinner-wrapper">
            <div className="safety-loading-spinner"></div>
            <span className="safety-loading-text">Checking your medicines...</span>
          </div>

          <div className="safety-loading-skeletons">
            <div className="skeleton-summary-card">
              <div className="skeleton-line title"></div>
              <div className="skeleton-grid-three">
                <div className="skeleton-block"></div>
                <div className="skeleton-block"></div>
                <div className="skeleton-block"></div>
              </div>
            </div>
            
            <div className="skeleton-interactions-list">
              <div className="skeleton-line title select"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          </div>
        </div>
      ) : interactions.length === 0 ? (
        <div className="safety-empty-container">
          <div className="safety-empty-content">
            <div className="safety-empty-icon-shield">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h2 className="safety-empty-title">No interactions found</h2>
            <p className="safety-empty-subtitle">Your current medicines have no interactions to display.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Safety Status Summary */}
          <div className="safety-check-summary-section">
            <div className="safety-summary-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary)' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h2 className="safety-summary-title">Safety Status Summary</h2>
            </div>

            <div className="safety-summary-cards-container">
              {/* Severe */}
              <div className="status-card status-card-severe">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🔴</span>
                  <span className="status-card-label">Severe</span>
                </div>
                <span className="status-card-count">{summaryData.severe}</span>
              </div>

              {/* Moderate */}
              <div className="status-card status-card-moderate">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟠</span>
                  <span className="status-card-label">Moderate</span>
                </div>
                <span className="status-card-count">{summaryData.moderate}</span>
              </div>

              {/* Safe */}
              <div className="status-card status-card-safe">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟢</span>
                  <span className="status-card-label">Safe</span>
                </div>
                <span className="status-card-count">{summaryData.safe}</span>
              </div>
            </div>

            {/* Overall status notice box */}
            <div className="safety-message-container">
              <div className="safety-message-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="safety-message-text">{getOverallMessage(summaryData)}</span>
            </div>
          </div>

          {/* Interactions List */}
          <div className="safety-interactions-section">
            <h2 className="safety-interactions-title">Interactions Found</h2>
            <p className="safety-interactions-subtitle">Click to interact</p>
            
            <div className="safety-interactions-list">
              {interactions.map((interaction) => {
                const config = getSeverityConfig(interaction.severity);
                return (
                  <div
                    key={interaction.id}
                    className={`interaction-result-card interaction-severity-${config.colorClass}`}
                    style={{ '--severity-accent-color': config.colorHex }}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails(interaction);
                      }
                    }}
                  >
                    <div className="interaction-card-info-row">
                      <span className={`interaction-severity-badge ${config.badgeClass}`}>
                        <span className="severity-badge-icon" aria-hidden="true" style={{ marginRight: '0.2rem' }}>{config.icon}</span>
                        {config.label}
                      </span>
                    </div>

                    <div className="interaction-drugs-row">
                      <span className="drug-name-a">{interaction.drugA}</span>
                      <span className="interaction-arrow-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m17 8 4 4-4 4" />
                          <path d="M3 12h18" />
                          <path d="m7 16-4-4 4-4" />
                        </svg>
                      </span>
                      <span className="drug-name-b">{interaction.drugB}</span>
                    </div>

                    <p className="interaction-card-description">{interaction.description}</p>

                    <div className="interaction-card-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewDetails) {
                            onViewDetails(interaction);
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SafetyCheck;
