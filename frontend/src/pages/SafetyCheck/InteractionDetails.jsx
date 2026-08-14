import React, { useState, useEffect } from 'react';
import { getInteractionExplanation } from '../../services/interactions/interactionService';
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
  major: {
    label: 'Major',
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
  const displayInteraction = interaction || {
    drugA: 'naproxen',
    drugB: 'warfarin',
    severity: 'Major',
    description: 'Potential major interaction identified between naproxen and warfarin.'
  };

  const config = getSeverityConfig(displayInteraction.severity);

  const [aiData, setAiData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAi(true);
    setAiError(null);

    const drugA = displayInteraction.drugA || displayInteraction.medicine_a?.name || 'naproxen';
    const drugB = displayInteraction.drugB || displayInteraction.medicine_b?.name || 'warfarin';
    const severity = displayInteraction.severity || 'Major';

    getInteractionExplanation(drugA, drugB, severity)
      .then((res) => {
        if (!cancelled && res && res.success && res.ai_explanation) {
          setAiData(res.ai_explanation);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('AI explanation fetch failed, using fallback:', err);
          setAiError('Could not load live AI guidance.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAi(false);
      });

    return () => { cancelled = true; };
  }, [displayInteraction.drugA, displayInteraction.drugB, displayInteraction.severity]);

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
          <span className="drug-name-a">{displayInteraction.drugA || displayInteraction.medicine_a?.name}</span>
          <span className="interaction-arrow-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m17 8 4 4-4 4" />
              <path d="M3 12h18" />
              <path d="m7 16-4-4 4-4" />
            </svg>
          </span>
          <span className="drug-name-b">{displayInteraction.drugB || displayInteraction.medicine_b?.name}</span>
        </div>

        <p className="details-short-description">{displayInteraction.description}</p>
      </div>

      {/* AI Content Boxes Section */}
      <div className="ai-placeholders-section">
        {/* Block 1: What does this mean? */}
        <div className="placeholder-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="placeholder-box-title">What does this mean?</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E7490', backgroundColor: '#ECFEFF', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>✨ AI Analysis</span>
          </div>
          <div className="placeholder-box-content">
            {loadingAi ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Generating clinical AI explanation…</p>
            ) : (
              <p style={{ color: '#2C3E50', lineHeight: 1.6, margin: 0 }}>
                {aiData?.what_does_this_mean || 'Taking these medications together may increase the risk of adverse side effects or alter drug effectiveness.'}
              </p>
            )}
          </div>
        </div>

        {/* Block 2: What to watch for? */}
        <div className="placeholder-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="placeholder-box-title">What to watch for?</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E7490', backgroundColor: '#ECFEFF', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>✨ AI Guidance</span>
          </div>
          <div className="placeholder-box-content">
            {loadingAi ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Generating warning signs…</p>
            ) : (
              <p style={{ color: '#2C3E50', lineHeight: 1.6, margin: 0 }}>
                {aiData?.what_to_watch_for || 'Observe closely for signs of unusual symptoms, bleeding, fatigue, or abdominal discomfort.'}
              </p>
            )}
          </div>
        </div>

        {/* Block 3: What should you do? */}
        <div className="placeholder-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="placeholder-box-title">What should you do?</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0E7490', backgroundColor: '#ECFEFF', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>✨ Action Plan</span>
          </div>
          <div className="placeholder-box-content">
            {loadingAi ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Generating recommendations…</p>
            ) : (
              <p style={{ color: '#2C3E50', lineHeight: 1.6, margin: 0 }}>
                {aiData?.what_should_you_do || 'Consult your prescribing doctor or pharmacist before continuing or changing any medication.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Disclaimer Banner */}
      {aiData?.disclaimer && (
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>ℹ️</span>
          <span>{aiData.disclaimer}</span>
        </div>
      )}

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
