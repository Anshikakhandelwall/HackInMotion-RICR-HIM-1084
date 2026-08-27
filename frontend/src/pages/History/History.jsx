import React, { useState, useEffect } from 'react';
import HistoryDetails from './HistoryDetails';
import { getHistory, clearHistory } from '../../services/history/historyService';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import './History.css';

export const History = ({ onNavigate, currentUser }) => {
  const { t } = useLanguage();
  const [historyRecords, setHistoryRecords] = useState(() => getHistory());
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    const handleHistoryUpdate = (e) => {
      if (e.detail) {
        setHistoryRecords(e.detail);
      } else {
        setHistoryRecords(getHistory());
      }
    };

    window.addEventListener('mediguard:history_updated', handleHistoryUpdate);
    return () => window.removeEventListener('mediguard:history_updated', handleHistoryUpdate);
  }, []);

  const handleClearHistory = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      clearHistory();
      setHistoryRecords([]);
    }
  };

  // If a record is selected, show details view
  if (selectedRecordId) {
    const selectedRecord = historyRecords.find((record) => record.id === selectedRecordId);
    if (selectedRecord) {
      return (
        <HistoryDetails
          record={selectedRecord}
          onBack={() => setSelectedRecordId(null)}
          currentUser={currentUser}
        />
      );
    }
  }

  return (
    <div className="history-page-container">
      {/* Page Header */}
      <div className="history-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="history-page-title">{t('historyTitle')}</h1>
          <p className="history-page-subtitle">{t('historySubtitle')}</p>
        </div>
        {historyRecords.length > 0 && (
          <button
            type="button"
            className="history-clear-btn"
            onClick={handleClearHistory}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              color: '#EF4444',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {t('clearHistoryBtn')}
          </button>
        )}
      </div>

      {/* History Records List */}
      {historyRecords.length === 0 ? (
        <div className="history-empty-message" style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📜</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1E293B', fontSize: '1.1rem' }}>{t('noHistoryText')}</h3>
          <p style={{ margin: '0 0 1.25rem', color: '#64748B', fontSize: '0.9rem' }}>
            {t('screenCabinetToRecord')}
          </p>
          <Button
            type="button"
            variant="primary"
            size="medium"
            onClick={() => onNavigate && onNavigate('/safety-check')}
          >
            {t('runSafetyCheck')}
          </Button>
        </div>
      ) : (
        <div className="history-records-list">
          {historyRecords.map((record) => {
            const isSafe = record.status === 'Safe';
            return (
              <div key={record.id} className="history-record-card">
                <div className="history-card-header">
                  <span className="history-card-datetime">
                    {record.date} &bull; {record.time}
                  </span>
                  <span className={`history-status-indicator status-${isSafe ? 'safe' : 'attention'}`}>
                    <span className="status-dot" style={{ marginRight: '0.2rem' }}>{isSafe ? '🟢' : '🔴'}</span>
                    {record.status === 'Safe' ? t('safe') : t('attentionRequired')}
                  </span>
                </div>
                
                <div className="history-card-content-wrapper">
                  <div className="history-card-body">
                    <div className="history-stat-item">
                      <span className="stat-icon" aria-hidden="true" style={{ marginRight: '0.2rem' }}>💊</span>
                      <span className="stat-text">{record.medicinesCount} {record.medicinesCount === 1 ? t('medicineChecked') : t('medicinesChecked')}</span>
                    </div>
                    <div className="history-stat-item">
                      <span className="stat-icon" aria-hidden="true" style={{ marginRight: '0.1rem' }}>🔄</span>
                      <span className="stat-text">{record.interactionsCount} {record.interactionsCount === 1 ? t('interactionFound') : t('interactionsFoundCount')}</span>
                    </div>
                  </div>

                  <div className="history-card-actions">
                    <button 
                      type="button" 
                      className="history-view-details-btn"
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      {t('viewDetailsBtn')}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;

