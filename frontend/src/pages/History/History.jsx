import React from 'react';
import './History.css';

const MOCK_HISTORY = [
  {
    id: 'check-1',
    date: 'August 12, 2026',
    time: '10:30 AM',
    medicinesCount: 4,
    interactionsCount: 2,
    status: 'Attention Required',
  },
  {
    id: 'check-2',
    date: 'August 10, 2026',
    time: '04:15 PM',
    medicinesCount: 3,
    interactionsCount: 0,
    status: 'Safe',
  },
  {
    id: 'check-3',
    date: 'August 05, 2026',
    time: '09:00 AM',
    medicinesCount: 5,
    interactionsCount: 1,
    status: 'Attention Required',
  },
  {
    id: 'check-4',
    date: 'July 28, 2026',
    time: '11:45 AM',
    medicinesCount: 2,
    interactionsCount: 0,
    status: 'Safe',
  },
  {
    id: 'check-5',
    date: 'July 15, 2026',
    time: '02:30 PM',
    medicinesCount: 4,
    interactionsCount: 3,
    status: 'Attention Required',
  }
];

export const History = () => {
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
