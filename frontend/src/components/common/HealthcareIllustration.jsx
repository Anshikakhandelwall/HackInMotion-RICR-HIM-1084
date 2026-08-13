import React from 'react';

/**
 * HealthcareIllustration Component
 * Reusable visual hero vector graphics for the Left Panel of Login and Register pages.
 * Displays an elegant medical safety shield with organic peach/rose decorative background elements.
 */
export const HealthcareIllustration = ({ type = 'login', className = '' }) => {
  return (
    <div className={`healthcare-illustration-wrapper ${className}`} style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
      <svg
        viewBox="0 0 400 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Subtle warm gradients */}
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A63D35" />
            <stop offset="100%" stopColor="#C45A52" />
          </linearGradient>

          <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCEEEB" />
            <stop offset="100%" stopColor="#F8DDD9" />
          </linearGradient>

          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9DDD9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F4ECE9" stopOpacity="0.2" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#A63D35" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Outer Organic Background Blobs */}
        <path
          d="M 200 40 C 290 20, 360 90, 350 180 C 340 270, 270 330, 180 320 C 90 310, 40 230, 60 140 C 80 50, 110 60, 200 40 Z"
          fill="url(#blobGrad)"
          opacity="0.85"
        />

        {/* Decorative Concentric Rings */}
        <circle cx="200" cy="180" r="130" stroke="url(#ringGrad)" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="200" cy="180" r="105" stroke="#E9DDD9" strokeWidth="1.5" opacity="0.6" />

        {/* Floating Health Sparkles / Dots */}
        <circle cx="95" cy="100" r="6" fill="#A63D35" opacity="0.3" />
        <circle cx="310" cy="120" r="9" fill="#D98278" opacity="0.4" />
        <circle cx="320" cy="250" r="5" fill="#A63D35" opacity="0.25" />
        <circle cx="85" cy="240" r="7" fill="#E8A49B" opacity="0.5" />

        {/* Central Shield Card Backdrop */}
        <rect
          x="125"
          y="95"
          width="150"
          height="170"
          rx="24"
          fill="#FFFFFF"
          filter="url(#softGlow)"
          stroke="#E9DDD9"
          strokeWidth="1.5"
        />

        {/* Main Reddish Safety Shield */}
        <path
          d="M 200 125 L 245 142 V 172 C 245 200 226 223 200 232 C 174 223 155 200 155 172 V 142 L 200 125 Z"
          fill="url(#shieldGrad)"
        />

        {/* Inner Heartbeat / Checkmark Line inside Shield */}
        <path
          d="M 178 178 L 192 192 L 222 162"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Decorative Floating Pill Badge */}
        <g transform="translate(230, 205)" filter="url(#softGlow)">
          <rect x="0" y="0" width="76" height="34" rx="17" fill="#FFFFFF" stroke="#E9DDD9" strokeWidth="1" />
          <rect x="8" y="8" width="18" height="18" rx="9" fill="#A63D35" opacity="0.15" />
          <path d="M 17 12 V 22 M 12 17 H 22" stroke="#A63D35" strokeWidth="2" strokeLinecap="round" />
          <rect x="32" y="12" width="32" height="4" rx="2" fill="#24201F" opacity="0.7" />
          <rect x="32" y="19" width="22" height="3" rx="1.5" fill="#756866" opacity="0.5" />
        </g>

        {/* Verification Checkmark Pill */}
        <g transform="translate(85, 135)">
          <rect x="0" y="0" width="70" height="30" rx="15" fill="#FFFFFF" stroke="#E9DDD9" strokeWidth="1" />
          <circle cx="15" cy="15" r="8" fill="#2D8A56" />
          <path d="M 11 15 L 14 18 L 19 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="28" y="13" width="30" height="4" rx="2" fill="#24201F" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};

export default HealthcareIllustration;
