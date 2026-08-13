import React from 'react';
import Button from '../../components/common/Button';

export const Medicines = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#24201F' }}>My Medicines</h1>
          <p style={{ color: '#6E6462', fontSize: '0.875rem' }}>Manage your active medication cabinet</p>
        </div>
        <Button type="button" variant="primary" size="medium" onClick={() => {}}>
          + Add New Medicine
        </Button>
      </div>

      <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '18px', border: '1px solid #E9DDD9', boxShadow: '0 12px 36px -8px rgba(166, 61, 53, 0.08)' }}>
        <p style={{ color: '#6E6462', textAlign: 'center', padding: '2rem 0' }}>
          💊 <strong>Medication Cabinet Placeholder</strong> — Full medicine management, dosages, and Indian brand normalization will be connected here.
        </p>
      </div>
    </div>
  );
};

export default Medicines;
