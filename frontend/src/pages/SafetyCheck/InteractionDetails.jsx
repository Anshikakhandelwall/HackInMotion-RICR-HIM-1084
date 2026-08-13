import React from 'react';
import './InteractionDetails.css';

// Reusable severity config matching SafetyCheck
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

export const InteractionDetails = ({ interaction, onBack }) => {
  // Gracefully handle if no interaction was selected
  const displayInteraction = interaction || {
    drugA: 'Unknown Medicine A',
    drugB: 'Unknown Medicine B',
    severity: 'Unknown',
    description: 'No description available.'
  };

  const config = getSeverityConfig(displayInteraction.severity);

  return (
    <div className="interaction-details-page-container">
      {/* Back button link container */}
      <div className="back-navigation-container">
        <button className="back-link-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Results
        </button>
      </div>

      {/* Main interaction details card */}
      <div className="interaction-details-card">
        <div className="details-header">
          <h1 className="details-page-title">Interaction Details</h1>
          <span className={`interaction-severity-badge ${config.badgeClass}`}>
            <span className="severity-badge-icon" aria-hidden="true" style={{ marginRight: '0.2rem' }}>{config.icon}</span>
            {config.label} Interaction
          </span>
        </div>

        <div className="details-drugs-row">
          <span className="drug-name-a">{displayInteraction.drugA}</span>
          <span className="interaction-arrow-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m17 8 4 4-4 4" />
              <path d="M3 12h18" />
              <path d="m7 16-4-4 4-4" />
            </svg>
          </span>
          <span className="drug-name-b">{displayInteraction.drugB}</span>
        </div>

        <p className="details-short-description">{displayInteraction.description}</p>
      </div>

      {/* Placeholder boxes section for future AI contents */}
      <div className="ai-placeholders-section">
        {/* Block 1 */}
        <div className="placeholder-box">
          <h3 className="placeholder-box-title">What does this mean?</h3>
          <div className="placeholder-box-content">
            <p>AI-generated information will appear here.</p>
          </div>
        </div>

        {/* Block 2 */}
        <div className="placeholder-box">
          <h3 className="placeholder-box-title">What to watch for?</h3>
          <div className="placeholder-box-content">
            <p>AI-generated information will appear here.</p>
          </div>
        </div>

        {/* Block 3 */}
        <div className="placeholder-box">
          <h3 className="placeholder-box-title">What should you do?</h3>
          <div className="placeholder-box-content">
            <p>AI-generated information will appear here.</p>
          </div>
        </div>
      </div>

      {/* Evidence & Sources section */}
      <div className="evidence-sources-section">
        <h2 className="evidence-sources-title">Evidence & Sources</h2>
        <div className="sources-container">
          {MOCK_SOURCES.map((source, index) => (
            <div key={index} className="source-card">
              <h4 className="source-name">{source.name}</h4>
              <p className="source-reference">{source.reference}</p>
              <div className="source-indicator-wrapper">
                <span className="source-indicator">[ {source.indicator} ]</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MOCK_SOURCES = [
  {
    name: 'National Institutes of Health (NIH) Drug Database',
    reference: 'Supporting clinical reference and documentation regarding concomitant administration risks.',
    indicator: 'Source'
  },
  {
    name: 'FDA Drug Safety Communication',
    reference: 'Post-marketing surveillance and active safety communications database.',
    indicator: 'Source'
  },
  {
    name: 'Prescribers\' Digital Reference (PDR)',
    reference: 'Official guidelines on drug-to-drug interactions classifications and outcomes.',
    indicator: 'Source'
  }
];

export default InteractionDetails;

