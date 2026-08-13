import React from 'react';

export const History = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#24201F' }}>Screening History</h1>
        <p style={{ color: '#6E6462', fontSize: '0.875rem' }}>View past medication safety check logs and evidence</p>
      </div>

      <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '18px', border: '1px solid #E9DDD9', boxShadow: '0 12px 36px -8px rgba(166, 61, 53, 0.08)' }}>
        <p style={{ color: '#6E6462', textAlign: 'center', padding: '2rem 0' }}>
          📋 <strong>History Logs Placeholder</strong> — Past screening results and saved safety reports will be stored and listed here.
        </p>
      </div>
    </div>
  );
};

export default History;
