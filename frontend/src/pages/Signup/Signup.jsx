import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import BrandLogo from '../../components/common/BrandLogo';
import HealthcareIllustration from '../../components/common/HealthcareIllustration';
import { useLanguage } from '../../context/LanguageContext';
import './Signup.css';

/**
 * Signup Page Component
 * Renders the MediGuard account registration page in a matching 2-column SaaS layout:
 * Left panel features branding tagline & healthcare safety vector illustration.
 * Right panel features the register form card.
 */
export const Signup = ({ onNavigateToLogin, onSuccess }) => {
  const { t } = useLanguage();

  return (
    <div className="signup-page">
      {/* Soft Organic Peach/Rose Background Shapes */}
      <div className="bg-shape bg-shape-top-left" aria-hidden="true" />
      <div className="bg-shape bg-shape-bottom-right" aria-hidden="true" />

      <main className="signup-layout-container">
        {/* Left Hero Panel (Visual & Brand Identity) */}
        <div className="signup-hero-panel">
          <div className="hero-brand-top">
            <BrandLogo size="large" />
          </div>

          <div className="hero-content">
            <h2 className="hero-tagline">
              {t('joinNetworkTitle')}
            </h2>
            <p className="hero-description">
              {t('joinNetworkSub')}
            </p>

            <div className="hero-illustration-area">
              <HealthcareIllustration type="register" />
            </div>

            <div className="hero-badges">
              <span className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t('rxNormStandardized')}
              </span>
              <span className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                {t('freeSafetyTools')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="signup-form-panel">
          <RegisterForm
            onNavigateToLogin={onNavigateToLogin}
            onSuccess={onSuccess}
          />
        </div>
      </main>
    </div>
  );
};

export default Signup;

