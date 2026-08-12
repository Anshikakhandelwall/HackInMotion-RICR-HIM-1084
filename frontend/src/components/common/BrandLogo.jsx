import React from 'react';

/**
 * BrandLogo component for MediGuard
 * Features a subtle, modern safety shield motif with clean typography in light warm-red theme.
 */
export const BrandLogo = ({ size = 'medium', className = '' }) => {
  const iconSize = size === 'large' ? 36 : size === 'small' ? 24 : 28;
  const fontSize = size === 'large' ? '1.6rem' : size === 'small' ? '1.1rem' : '1.35rem';

  return (
    <div
      className={`brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #A6534B 0%, #B8665E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(166, 83, 75, 0.2)',
          color: '#ffffff',
          flexShrink: 0,
        }}
      >
        {/* Subtle Shield Safety Icon */}
        <svg
          width={iconSize * 0.55}
          height={iconSize * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>

      <span
        style={{
          fontSize: fontSize,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#2B2524',
        }}
      >
        Medi<span style={{ color: '#A6534B' }}>Guard</span>
      </span>
    </div>
  );
};

export default BrandLogo;
