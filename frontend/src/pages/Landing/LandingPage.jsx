import React from 'react';
import LanguageSelector from '../../components/common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import './LandingPage.css';

/**
 * MediGuard Landing Page Component
 * Polished, healthcare-technology landing page introducing MediGuard's core purpose:
 * Manage medicines -> Check safety -> Understand interactions.
 */
export const LandingPage = ({ onNavigateToLogin, onNavigateToSignup }) => {
  const { t } = useLanguage();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page-container">
      {/* 1. NAVBAR */}
      <nav className="landing-navbar">
        <div className="landing-nav-brand" onClick={() => scrollToSection('hero')}>
          <div className="brand-shield-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="brand-logo-text">MediGuard</span>
        </div>

        <div className="landing-nav-links">
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('hero')}>
            {t('landingNavHome')}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('features')}>
            {t('landingNavFeatures')}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('how-it-works')}>
            {t('landingNavHowItWorks')}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('preview')}>
            {t('landingNavPreview')}
          </button>
        </div>

        <div className="landing-nav-actions">
          {/* Language Selector Dropdown */}
          <LanguageSelector />

          <button type="button" className="nav-secondary-btn" onClick={onNavigateToLogin}>
            {t('login')}
          </button>
          <button type="button" className="nav-primary-btn" onClick={onNavigateToSignup}>
            {t('landingGetStarted')}
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="landing-hero-section">
        <div className="hero-content-left">
          <div className="hero-badge-pill">
            <span>{t('landingBadge')}</span>
          </div>

          <h1 className="hero-main-title">
            <span className="title-block">{t('landingTitle1')}</span>
            <span className="title-block title-highlight">{t('landingTitle2')}</span>
            <span className="title-block">{t('landingTitle3')}</span>
          </h1>

          <p className="hero-subtitle">{t('landingSubtitle')}</p>

          <div className="hero-cta-group">
            <button type="button" className="hero-primary-cta" onClick={onNavigateToSignup}>
              {t('landingGetStarted')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button type="button" className="hero-secondary-cta" onClick={onNavigateToLogin}>
              {t('login')}
            </button>
          </div>
        </div>

        {/* Hero Visual Card Stack */}
        <div className="hero-visual-right">
          <div className="hero-visual-card main-visual-card">
            <div className="visual-card-header">
              <span className="visual-dot dot-red" />
              <span className="visual-dot dot-yellow" />
              <span className="visual-dot dot-green" />
              <span className="visual-header-title">{t('landingPreviewSafetyCheckHeader')}</span>
            </div>

            <div className="visual-card-body">
              <div className="visual-med-row">
                <div className="visual-med-info">
                  <span className="visual-med-icon">💊</span>
                  <div>
                    <span className="visual-med-name">Paracetamol</span>
                    <span className="visual-med-dosage">500mg • Daily</span>
                  </div>
                </div>
                <span className="visual-time-badge">⏰ 08:30 AM</span>
              </div>

              <div className="visual-med-row">
                <div className="visual-med-info">
                  <span className="visual-med-icon">💊</span>
                  <div>
                    <span className="visual-med-name">Warfarin</span>
                    <span className="visual-med-dosage">5mg • Daily</span>
                  </div>
                </div>
                <span className="visual-time-badge">⏰ 01:00 PM</span>
              </div>

              <div className="visual-status-box safe-box">
                <div className="status-box-header">
                  <span className="status-shield-icon">🛡️</span>
                  <span className="status-title">{t('landingPreviewSafetyStatus')}</span>
                </div>
                <span className="status-text">{t('landingPreviewSafeMsg')}</span>
              </div>
            </div>
          </div>

          {/* Floating UI Badges */}
          <div className="floating-badge badge-top-right">
            <span className="badge-icon">✓</span>
            <span className="badge-text">{t('landingHeroFloating1')}</span>
          </div>
          <div className="floating-badge badge-bottom-left">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">{t('landingHeroFloating2')}</span>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT VALUE SECTION */}
      <section id="features" className="landing-section features-section">
        <div className="section-header">
          <h2 className="section-title">{t('landingWhyTitle')}</h2>
          <p className="section-subtitle">{t('landingWhySubtitle')}</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-circle icon-red">💊</div>
            <h3 className="feature-card-title">{t('landingCard1Title')}</h3>
            <p className="feature-card-desc">{t('landingCard1Desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-shield">🛡️</div>
            <h3 className="feature-card-title">{t('landingCard2Title')}</h3>
            <p className="feature-card-desc">{t('landingCard2Desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-warning">⚠️</div>
            <h3 className="feature-card-title">{t('landingCard3Title')}</h3>
            <p className="feature-card-desc">{t('landingCard3Desc')}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-check">✓</div>
            <h3 className="feature-card-title">{t('landingCard4Title')}</h3>
            <p className="feature-card-desc">{t('landingCard4Desc')}</p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">{t('landingHowTitle')}</h2>
          <p className="section-subtitle">{t('landingHowSubtitle')}</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number-badge">{t('landingStep1Num')}</div>
            <div className="step-icon">📋</div>
            <h3 className="step-title">{t('landingStep1Title')}</h3>
            <p className="step-desc">{t('landingStep1Desc')}</p>
          </div>

          <div className="step-connector-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="step-card">
            <div className="step-number-badge">{t('landingStep2Num')}</div>
            <div className="step-icon">🔍</div>
            <h3 className="step-title">{t('landingStep2Title')}</h3>
            <p className="step-desc">{t('landingStep2Desc')}</p>
          </div>

          <div className="step-connector-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="step-card">
            <div className="step-number-badge">{t('landingStep3Num')}</div>
            <div className="step-icon">📊</div>
            <h3 className="step-title">{t('landingStep3Title')}</h3>
            <p className="step-desc">{t('landingStep3Desc')}</p>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT PREVIEW SECTION */}
      <section id="preview" className="landing-section preview-section">
        <div className="section-header">
          <h2 className="section-title">{t('landingPreviewTitle')}</h2>
          <p className="section-subtitle">{t('landingPreviewSubtitle')}</p>
        </div>

        <div className="preview-app-shell">
          <div className="preview-app-header">
            <span className="preview-brand-tag">{t('networkPortalTag')}</span>
            <span className="preview-user-tag">👤 {t('landingPreviewDemo')}</span>
          </div>

          <div className="preview-app-grid">
            {/* Cabinet Preview */}
            <div className="preview-card cabinet-preview">
              <div className="card-preview-header">
                <h3>{t('landingPreviewCabinetTitle')}</h3>
                <span className="preview-count">{t('landingPreviewCount')}</span>
              </div>
              <ul className="preview-list">
                <li className="preview-item">
                  <span className="med-dot" />
                  <span className="med-name">Paracetamol</span>
                  <span className="med-time">⏰ 08:30 AM</span>
                </li>
                <li className="preview-item">
                  <span className="med-dot" />
                  <span className="med-name">Metformin</span>
                  <span className="med-time">⏰ 01:00 PM</span>
                </li>
                <li className="preview-item">
                  <span className="med-dot" />
                  <span className="med-name">Amlodipine</span>
                  <span className="med-time">⏰ 09:00 PM</span>
                </li>
              </ul>
            </div>

            {/* Safety Overview Preview */}
            <div className="preview-card safety-preview">
              <div className="card-preview-header">
                <h3>{t('landingPreviewSafetyTitle')}</h3>
                <span className="preview-status-pill">{t('landingPreviewSafeStatus')}</span>
              </div>
              <div className="preview-safety-body">
                <div className="stat-pill safe">
                  <span className="stat-num">0</span>
                  <span className="stat-label">{t('landingPreviewSevere')}</span>
                </div>
                <div className="stat-pill moderate">
                  <span className="stat-num">0</span>
                  <span className="stat-label">{t('landingPreviewModerate')}</span>
                </div>
                <div className="stat-pill ok">
                  <span className="stat-num">3</span>
                  <span className="stat-label">{t('landingPreviewSafe')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & SAFETY DISCLAIMER */}
      <section className="disclaimer-section">
        <div className="disclaimer-container">
          <span className="disclaimer-icon">ℹ️</span>
          <p className="disclaimer-text">{t('landingDisclaimer')}</p>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-card">
          <h2 className="bottom-cta-title">{t('landingBottomCtaTitle')}</h2>
          <div className="bottom-cta-buttons">
            <button type="button" className="hero-primary-cta" onClick={onNavigateToSignup}>
              {t('landingGetStarted')}
            </button>
            <div className="already-account-wrap">
              <span className="already-text">{t('landingAlreadyAccount')}</span>
              <button type="button" className="already-link" onClick={onNavigateToLogin}>
                {t('login')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-shield-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="brand-logo-text">MediGuard</span>
          </div>

          <p className="footer-desc">{t('landingFooterDesc')}</p>

          <div className="footer-links">
            <button type="button" onClick={() => scrollToSection('hero')}>{t('landingNavHome')}</button>
            <button type="button" onClick={() => scrollToSection('features')}>{t('landingNavFeatures')}</button>
            <button type="button" onClick={() => scrollToSection('how-it-works')}>{t('landingNavHowItWorks')}</button>
            <button type="button" onClick={onNavigateToLogin}>{t('login')}</button>
            <button type="button" onClick={onNavigateToSignup}>{t('landingGetStarted')}</button>
          </div>

          <p className="footer-copyright">{t('landingCopyright')}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
