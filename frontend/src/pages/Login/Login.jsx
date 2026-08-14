import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import BrandLogo from '../../components/common/BrandLogo';
import HealthcareIllustration from '../../components/common/HealthcareIllustration';
import './Login.css';

/**
 * Login Page Component
 * Renders the MediGuard login page with a 2-column SaaS mockup layout:
 * Left panel features branding tagline & healthcare safety illustration.
 * Right panel features the compact login form card.
 */
export const Login = ({ onNavigateToSignup, onForgotPassword, onSuccess }) => {
  return (
    <div className="login-page">
      {/* Soft Organic Peach/Rose Background Shapes */}
      <div className="bg-shape bg-shape-top-left" aria-hidden="true" />
      <div className="bg-shape bg-shape-bottom-right" aria-hidden="true" />

      <main className="login-layout-container">
        {/* Left Hero Panel (Visual & Brand Identity) */}
        <div className="login-hero-panel">
          <div className="hero-brand-top">
            <BrandLogo size="large" />
          </div>

          <div className="hero-content">
            <h2 className="hero-tagline">
              Smart Medicine Safety &amp; Drug Interaction Assistant
            </h2>
            <p className="hero-description">
              Verify prescription combinations, identify interaction risks, and protect patient safety with evidence-backed intelligence.
            </p>

            <div className="hero-illustration-area">
              <HealthcareIllustration type="login" />
            </div>

            <div className="hero-badges">
              <span className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                DDInter 2.0 Verified
              </span>
              <span className="hero-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Patient Safety Screening
              </span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <LoginForm
            onNavigateToSignup={onNavigateToSignup}
            onForgotPassword={onForgotPassword}
            onSuccess={onSuccess}
          />
        </div>
      </main>
    </div>
  );
};

export default Login;
