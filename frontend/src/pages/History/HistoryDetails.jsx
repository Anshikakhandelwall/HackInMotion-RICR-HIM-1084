import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const HistoryDetails = ({ record, onBack }) => {
  const { t } = useLanguage();
  const isSafe = record.status === 'Safe';

  return (
    <div className="history-details-container">
      {/* Back button */}
      <div className="history-details-back">
        <button type="button" className="back-to-history-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.4rem' }}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t('backToHistory')}
        </button>
      </div>

      {/* Main details summary card */}
      <div className="history-details-header-card">
        <div className="details-header-info">
          <h1 className="history-details-title">{t('historyDetailsTitle')}</h1>
          <p className="details-datetime">{record.date} at {record.time}</p>
        </div>

        <div className="details-stats-row">
          <div className="details-stat-box">
            <span className="details-stat-number">{record.medicinesCount}</span>
            <span className="details-stat-label">{record.medicinesCount === 1 ? t('medicineChecked') : t('medicinesChecked')}</span>
          </div>

          <div className="details-stat-box">
            <span className="details-stat-number">{record.interactionsCount}</span>
            <span className="details-stat-label">{record.interactionsCount === 1 ? t('interactionFound') : t('interactionsFoundCount')}</span>
          </div>
        </div>

        <div className="details-status-badge-container">
          <span className={`history-status-indicator status-${isSafe ? 'safe' : 'attention'}`}>
            <span className="status-dot" style={{ marginRight: '0.2rem' }}>{isSafe ? '🟢' : '🔴'}</span>
            {record.status === 'Safe' ? t('safe') : t('attentionRequired')}
          </span>
        </div>
      </div>

      {/* Medicines Checked list */}
      <div className="history-details-section">
        <h2 className="details-section-title">{t('medicinesCheckedLabel')}</h2>
        <div className="details-card-panel">
          <ul className="medicines-checked-details-list">
            {record.medicines.map((med, index) => (
              <li key={index} className="medicine-checked-detail-item">
                <span className="medicine-bullet" aria-hidden="true">💊</span>
                <span className="medicine-name-text">{med}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactions Found list */}
      <div className="history-details-section">
        <h2 className="details-section-title">{t('interactionsFound')}</h2>
        <div className="details-card-panel">
          {record.interactions.length === 0 ? (
            <div className="details-no-interactions">
              <span className="no-int-icon" aria-hidden="true">🟢</span>
              <p className="no-int-text">{t('statusSafeMsg')}</p>
            </div>
          ) : (
            <div className="details-interactions-list">
              {record.interactions.map((int) => {
                const severityLower = (int.severity || '').toLowerCase();
                const isSevere = severityLower === 'severe' || severityLower === 'major';
                // Translate severity label dynamically
                const localizedSeverity = severityLower === 'severe' || severityLower === 'major' 
                  ? t('severe') 
                  : severityLower === 'moderate' 
                  ? t('moderate') 
                  : severityLower === 'minor'
                  ? t('minor')
                  : t('unknownRisk');

                return (
                  <div key={int.id} className="history-details-interaction-row">
                    <div className="details-interaction-pair">
                      <span className="details-drug-pill">{int.drugA}</span>
                      <span className="details-arrow" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m17 8 4 4-4 4" />
                          <path d="M3 12h18" />
                          <path d="m7 16-4-4 4-4" />
                        </svg>
                      </span>
                      <span className="details-drug-pill">{int.drugB}</span>
                    </div>

                    <span className={`details-severity-label severity-${severityLower}`}>
                      <span className="severity-dot" aria-hidden="true" style={{ fontSize: '0.65rem', marginRight: '0.25rem' }}>{isSevere ? '🔴' : '🟠'}</span>
                      {localizedSeverity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDetails;

