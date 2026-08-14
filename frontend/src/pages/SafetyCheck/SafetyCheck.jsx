import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import MedicineListItem from '../../components/medicines/MedicineListItem';
import { checkPersonalizedSafety } from '../../services/interactions/interactionService';
import { saveHistoryRecord } from '../../services/history/historyService';
import { useLanguage } from '../../context/LanguageContext';
import './SafetyCheck.css';

// Reusable severity indicator configurations helper
const getSeverityConfig = (severity, t) => {
  if (!severity) {
    return {
      label: t('unknownRisk'),
      colorClass: 'unknown',
      badgeClass: 'severity-unknown-badge',
      icon: '⚪',
      colorHex: '#A3A3A3',
    };
  }
  
  const key = severity.toLowerCase();
  const configs = {
    severe: {
      label: t('severe'),
      colorClass: 'severe',
      badgeClass: 'severity-severe-badge',
      icon: '🔴',
      colorHex: 'var(--color-error)',
    },
    major: {
      label: t('severe'),
      colorClass: 'severe',
      badgeClass: 'severity-severe-badge',
      icon: '🔴',
      colorHex: 'var(--color-error)',
    },
    moderate: {
      label: t('moderate'),
      colorClass: 'moderate',
      badgeClass: 'severity-moderate-badge',
      icon: '🟠',
      colorHex: '#E27E36',
    },
    minor: {
      label: t('minor'),
      colorClass: 'safe', // visual green/orange style from original config
      badgeClass: 'severity-safe-badge',
      icon: '🟡',
      colorHex: '#D97706',
    },
    safe: {
      label: t('safe'),
      colorClass: 'safe',
      badgeClass: 'severity-safe-badge',
      icon: '🟢',
      colorHex: 'var(--color-success)',
    },
  };
  
  return configs[key] || {
    label: t('unknownRisk'),
    colorClass: 'unknown',
    badgeClass: 'severity-unknown-badge',
    icon: '⚪',
    colorHex: '#A3A3A3',
  };
};

/**
 * SafetyCheck Page Component (Route: /safety-check)
 */
export const SafetyCheck = ({ currentUser, onNavigate, onViewDetails }) => {
  const { t } = useLanguage();

  // Extract user's active medicines directly from user profile
  const activeMedicines = Array.isArray(currentUser?.regularMedicines)
    ? currentUser.regularMedicines
    : Array.isArray(currentUser?.regular_medicines)
    ? currentUser.regular_medicines
    : [];

  const medicalConditions = currentUser?.medicalConditions || currentUser?.medical_conditions || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [interactions, setInteractions] = useState([]);

  // Helper to dynamically calculate summary counts
  const getSummaryCounts = (items) => {
    const counts = { severe: 0, moderate: 0, safe: 0 };
    items.forEach((item) => {
      const sev = (item.severity || item.level || '').toLowerCase();
      if (sev === 'severe' || sev === 'major') counts.severe++;
      else if (sev === 'moderate') counts.moderate++;
      else counts.safe++;
    });
    return counts;
  };

  const summaryData = getSummaryCounts(interactions);

  // Automatically perform initial check on load if medicines present
  useEffect(() => {
    if (activeMedicines.length > 0) {
      handleCheckMedicines();
    } else {
      setInteractions([]);
    }
  }, [activeMedicines.join(',')]);

  const handleCheckMedicines = async () => {
    if (activeMedicines.length === 0) {
      setInteractions([]);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const res = await checkPersonalizedSafety(activeMedicines, medicalConditions);
      if (res && res.success) {
        const drugInts = res.drug_interactions?.interactions || res.interactions || [];
        const condWarns = res.patient_condition_warnings || [];

        const formattedDrugInts = drugInts.map((item, idx) => ({
          id: item.id || `int-${idx}`,
          drugA: item.medicine_a?.name || item.medicine_a?.rxnorm_name || 'Medicine A',
          drugB: item.medicine_b?.name || item.medicine_b?.rxnorm_name || 'Medicine B',
          severity: item.severity || item.level || 'Moderate',
          description: item.description || `Potential interaction detected.`,
        }));

        const formattedCondWarns = condWarns.map((item, idx) => ({
          id: `cond-${idx}`,
          drugA: item.title || 'Condition Warning',
          drugB: 'Medical Profile',
          severity: item.severity || 'Moderate',
          description: item.description || 'Caution recommended based on medical profile.',
        }));

        const allCards = [...formattedDrugInts, ...formattedCondWarns];
        setInteractions(allCards);

        // Record run to history service pipeline
        const medNames = activeMedicines.map((med) => (typeof med === 'string' ? med : (med.name || med.rxnorm_name || 'Medicine')));
        saveHistoryRecord({
          id: `check-${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          medicinesCount: medNames.length,
          interactionsCount: allCards.length,
          status: allCards.length > 0 ? 'Attention Required' : 'Safe',
          medicines: medNames,
          interactions: allCards,
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Safety check failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Derive dynamic overall message based on summary data
  const getOverallMessage = (summary) => {
    if (summary.severe > 0) {
      return `${summary.severe} ${t('severeOverallMsg')}`;
    } else if (summary.moderate > 0) {
      return `${summary.moderate} ${t('moderateOverallMsg')}`;
    } else {
      return t('statusSafeMsg');
    }
  };

  return (
    <div className="safety-check-page-container">
      {/* 1. Page Title & Description */}
      <div className="safety-check-page-header">
        <h1 className="safety-check-page-title">{t('safetyCheckTitle')}</h1>
        <p className="safety-check-page-subtitle">
          {t('safetyCheckSubtitle')}
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
            <h2 className="safety-check-card-title">{t('safetyCabinetTitle')}</h2>
            <p className="safety-check-card-subtitle">{t('safetyCabinetSub')}</p>
          </div>
        </div>

        {/* 3. Medicine Preview List Section */}
        <div className="safety-check-preview-content">
          <p className="safety-check-preview-hint">
            {t('databaseHint')}
          </p>

          {activeMedicines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#FAF8F5', borderRadius: '8px', border: '1px dashed #CBD5E1', margin: '1rem 0' }}>
              <p style={{ color: '#64748B', margin: '0 0 1rem', fontSize: '0.95rem' }}>
                {t('safetyCabinetEmpty')}
              </p>
              <Button
                type="button"
                variant="primary"
                size="medium"
                onClick={() => onNavigate && onNavigate('/medicines')}
              >
                + {t('addMedicinesToCabinet')}
              </Button>
            </div>
          ) : (
            <ul className="safety-check-preview-list">
              {activeMedicines.map((med, index) => {
                const key = typeof med === 'string' ? `med-${index}` : (med?.id || `med-${index}`);
                return (
                  <MedicineListItem 
                    key={key} 
                    medicine={med} 
                    className="safety-check-preview-item"
                    showReminder={false}
                  />
                );
              })}
            </ul>
          )}
        </div>

        {/* 4. Action Button Footer */}
        {activeMedicines.length > 0 && (
          <div className="safety-check-card-footer">
            <Button
              type="button"
              variant="primary"
              size="medium"
              className="check-medicines-btn"
              onClick={handleCheckMedicines}
              disabled={loading}
            >
              {loading ? t('checkingBtnLabel') : t('checkBtn')}
            </Button>
          </div>
        )}
      </div>

      {/* 5. Results Area Rendering */}
      {loading ? (
        <div className="safety-loading-container" aria-busy="true">
          <div className="safety-loading-spinner-wrapper">
            <div className="safety-loading-spinner"></div>
            <span className="safety-loading-text">{t('checkingProgress')}</span>
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
      ) : error ? (
        <div className="safety-error-container">
          <div className="safety-empty-content">
            <div className="safety-error-icon-warning">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="safety-error-title">{t('unableToComplete')}</h2>
            <p className="safety-error-subtitle">
              {t('somethingWentWrong')}
            </p>
            <div className="safety-error-actions" style={{ marginTop: '0.5rem' }}>
              <Button
                type="button"
                variant="primary"
                size="medium"
                className="retry-check-btn"
                onClick={handleCheckMedicines}
              >
                {t('tryAgain')}
              </Button>
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
            <h2 className="safety-empty-title">{t('noInteractionsTitle')}</h2>
            <p className="safety-empty-subtitle">{t('noInteractionsSub')}</p>
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
              <h2 className="safety-summary-title">{t('statusLabel')}</h2>
            </div>

            <div className="safety-summary-cards-container">
              {/* Severe */}
              <div className="status-card status-card-severe">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🔴</span>
                  <span className="status-card-label">{t('severe')}</span>
                </div>
                <span className="status-card-count">{summaryData.severe}</span>
              </div>

              {/* Moderate */}
              <div className="status-card status-card-moderate">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟠</span>
                  <span className="status-card-label">{t('moderate')}</span>
                </div>
                <span className="status-card-count">{summaryData.moderate}</span>
              </div>

              {/* Safe */}
              <div className="status-card status-card-safe">
                <div className="status-card-header">
                  <span className="status-card-icon" aria-hidden="true" style={{ fontSize: '1.1rem' }}>🟢</span>
                  <span className="status-card-label">{t('safe')}</span>
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
            <h2 className="safety-interactions-title">{t('interactionsFoundCount')}</h2>
            <p className="safety-interactions-subtitle">{t('interactionSubtitle')}</p>
            
            <div className="safety-interactions-list">
              {interactions.map((interaction) => {
                const config = getSeverityConfig(interaction.severity, t);
                return (
                  <div
                    key={interaction.id}
                    className={`interaction-result-card interaction-severity-${config.colorClass}`}
                    style={{ '--severity-accent-color': config.colorHex }}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails(interaction);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onViewDetails) {
                          onViewDetails(interaction);
                        }
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
                        {t('viewDetails')}
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

