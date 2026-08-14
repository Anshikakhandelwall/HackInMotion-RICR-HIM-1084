import React, { useState } from 'react';
import './History.css';
import HistoryDetails from './HistoryDetails';

const MOCK_HISTORY = [
  {
    id: 'check-1',
    date: 'August 12, 2026',
    time: '10:30 AM',
    medicinesCount: 4,
    interactionsCount: 2,
    status: 'Attention Required',
    medicines: ['Warfarin', 'Aspirin', 'Amlodipine', 'Simvastatin'],
    interactions: [
      { id: 'int-1-1', drugA: 'Warfarin', drugB: 'Aspirin', severity: 'Severe' },
      { id: 'int-1-2', drugA: 'Amlodipine', drugB: 'Simvastatin', severity: 'Moderate' }
    ]
  },
  {
    id: 'check-2',
    date: 'August 10, 2026',
    time: '04:15 PM',
    medicinesCount: 3,
    interactionsCount: 0,
    status: 'Safe',
    medicines: ['Amlodipine', 'Metoprolol', 'Lisinopril'],
    interactions: []
  },
  {
    id: 'check-3',
    date: 'August 05, 2026',
    time: '09:00 AM',
    medicinesCount: 5,
    interactionsCount: 1,
    status: 'Attention Required',
    medicines: ['Warfarin', 'Amlodipine', 'Simvastatin', 'Ibuprofen', 'Metformin'],
    interactions: [
      { id: 'int-3-1', drugA: 'Warfarin', drugB: 'Ibuprofen', severity: 'Severe' }
    ]
  },
  {
    id: 'check-4',
    date: 'July 28, 2026',
    time: '11:45 AM',
    medicinesCount: 2,
    interactionsCount: 0,
    status: 'Safe',
    medicines: ['Metformin', 'Atorvastatin'],
    interactions: []
  },
  {
    id: 'check-5',
    date: 'July 15, 2026',
    time: '02:30 PM',
    medicinesCount: 4,
    interactionsCount: 3,
    status: 'Attention Required',
    medicines: ['Warfarin', 'Aspirin', 'Ibuprofen', 'Clopidogrel'],
    interactions: [
      { id: 'int-5-1', drugA: 'Warfarin', drugB: 'Aspirin', severity: 'Severe' },
      { id: 'int-5-2', drugA: 'Warfarin', drugB: 'Ibuprofen', severity: 'Severe' },
      { id: 'int-5-3', drugA: 'Aspirin', drugB: 'Clopidogrel', severity: 'Moderate' }
    ]
  }
];

export const History = () => {
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  // If a record is selected, show details view
  if (selectedRecordId) {
    const selectedRecord = MOCK_HISTORY.find((record) => record.id === selectedRecordId);
    if (selectedRecord) {
      return (
        <HistoryDetails 
          record={selectedRecord} 
          onBack={() => setSelectedRecordId(null)} 
        />
      );
    }
  }

  return (
    <div className="history-page-container">
      {/* Page Header */}
      <div className="history-page-header">
        <h1 className="history-page-title">Safety Check History</h1>
        <p className="history-page-subtitle">View your previous medication safety checks.</p>
      </div>

      {/* History Records List */}
      {MOCK_HISTORY.length === 0 ? (
        <div className="history-empty-message">No history available.</div>
      ) : (
        <div className="history-records-list">
          {MOCK_HISTORY.map((record) => {
            const isSafe = record.status === 'Safe';
            return (
              <div key={record.id} className="history-record-card">
                <div className="history-card-header">
                  <span className="history-card-datetime">
                    {record.date} &bull; {record.time}
                  </span>
                  <span className={`history-status-indicator status-${isSafe ? 'safe' : 'attention'}`}>
                    <span className="status-dot" style={{ marginRight: '0.2rem' }}>{isSafe ? '🟢' : '🔴'}</span>
                    {record.status}
                  </span>
                </div>
                
                <div className="history-card-content-wrapper">
                  <div className="history-card-body">
                    <div className="history-stat-item">
                      <span className="stat-icon" aria-hidden="true" style={{ marginRight: '0.2rem' }}>💊</span>
                      <span className="stat-text">{record.medicinesCount} {record.medicinesCount === 1 ? 'medicine' : 'medicines'} checked</span>
                    </div>
                    <div className="history-stat-item">
                      <span className="stat-icon" aria-hidden="true" style={{ marginRight: '0.1rem' }}>🔄</span>
                      <span className="stat-text">{record.interactionsCount} {record.interactionsCount === 1 ? 'interaction' : 'interactions'} found</span>
                    </div>
                  </div>

                  <div className="history-card-actions">
                    <button 
                      type="button" 
                      className="history-view-details-btn"
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      View Details
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
