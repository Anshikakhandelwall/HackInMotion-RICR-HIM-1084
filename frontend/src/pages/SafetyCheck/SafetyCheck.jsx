import React from 'react';
import Button from '../../components/common/Button';

export const SafetyCheck = ({ onNavigate }) => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#24201F' }}>Drug Interaction Safety Check</h1>
        <p style={{ color: '#6E6462', fontSize: '0.875rem' }}>Screen medicine pairs against DDInter 2.0 database</p>
      </div>

      <div style={{ background: '#FFFFFF', padding: '2.5rem 2rem', borderRadius: '18px', border: '1px solid #E9DDD9', boxShadow: '0 12px 36px -8px rgba(166, 61, 53, 0.08)', textAlign: 'center' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '12px', background: '#FDF3F2', color: '#A63D35', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#24201F', marginBottom: '0.5rem' }}>
          Safety Checker Interface Placeholder
        </h2>
        <p style={{ color: '#6E6462', maxWidth: '500px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
          Deterministic DDInter 2.0 drug-drug interaction lookup and patient-friendly AI explanations will be rendered in this view.
        </p>
        <Button type="button" variant="primary" size="medium" onClick={() => onNavigate && onNavigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SafetyCheck;
