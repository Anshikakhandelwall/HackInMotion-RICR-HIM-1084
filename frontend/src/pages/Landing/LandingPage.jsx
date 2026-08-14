import React, { useState } from 'react';
import './LandingPage.css';

/**
 * MediGuard Landing Page Component
 * Polished, healthcare-technology landing page introducing MediGuard's core purpose:
 * Manage medicines -> Check safety -> Understand interactions.
 */
export const LandingPage = ({ onNavigateToLogin, onNavigateToSignup }) => {
  const [activeLang, setActiveLang] = useState('en'); // 'en' | 'hi'

  const content = {
    en: {
      badge: '🛡️ Smarter Medication Safety',
      title1: 'Your Medicines.',
      title2: 'Your Safety.',
      title3: 'Simplified.',
      subtitle: 'Easily manage your daily medications, screen for potential drug-drug interactions, and get clear, patient-friendly safety insights in seconds.',
      getStarted: 'Get Started',
      login: 'Login',
      alreadyAccount: 'Already have an account?',
      navHome: 'Home',
      navFeatures: 'Features',
      navHowItWorks: 'How It Works',
      navPreview: 'Preview',
      whyTitle: 'Why MediGuard?',
      whySubtitle: 'Everything you need to keep your medication routine safe and organized.',
      card1Title: 'Manage Medicines',
      card1Desc: 'Keep your current medications organized in one clean, centralized cabinet.',
      card2Title: 'Check Medication Safety',
      card2Desc: 'Review your active prescriptions and supplements for potential safety concerns.',
      card3Title: 'Understand Interactions',
      card3Desc: 'Get clear, patient-friendly explanations when potential drug interactions are identified.',
      card4Title: 'Simple, Understandable Results',
      card4Desc: 'Turn complex medical data into easy-to-understand guidance you can trust.',
      howTitle: 'How It Works',
      howSubtitle: 'Three simple steps to smarter medication management.',
      step1Num: '01',
      step1Title: 'Add Medicines',
      step1Desc: 'Enter your active daily prescriptions and supplements into your secure cabinet.',
      step2Num: '02',
      step2Title: 'Run Safety Check',
      step2Desc: 'Screen your full medication list against our verified drug interaction database.',
      step3Num: '03',
      step3Title: 'Understand Results',
      step3Desc: 'Receive clear safety warnings, risk classifications, and actionable guidance.',
      previewTitle: 'Built for Clarity & Peace of Mind',
      previewSubtitle: 'Preview how MediGuard organizes your medications and screens for risks.',
      previewCabinetTitle: 'Current Medicines',
      previewSafetyTitle: 'Safety Overview',
      previewSafeStatus: '✓ No major interaction detected',
      disclaimer: 'MediGuard is designed to provide medication information and safety insights. It does not replace professional medical advice.',
      bottomCtaTitle: 'Take a clearer look at your medication safety.',
      footerDesc: 'Medication management and safety insights, designed to make complex information easier to understand.',
      copyright: '© 2026 MediGuard. All rights reserved.',
    },
    hi: {
      badge: '🛡️ समझदार दवा सुरक्षा',
      title1: 'आपकी दवाएं।',
      title2: 'आपकी सुरक्षा।',
      title3: 'सरलीकृत।',
      subtitle: 'अपनी दैनिक दवाओं को आसानी से प्रबंधित करें, संभावित दवा-दवा इंटरैक्शन की जांच करें और सेकंडों में स्पष्ट सुरक्षा जानकारी प्राप्त करें।',
      getStarted: 'शुरू करें',
      login: 'लॉग इन करें',
      alreadyAccount: 'क्या आपके पास पहले से एक खाता है?',
      navHome: 'होम',
      navFeatures: 'विशेषताएं',
      navHowItWorks: 'यह कैसे काम करता है',
      navPreview: 'पूर्वावलोकन',
      whyTitle: 'MediGuard क्यों?',
      whySubtitle: 'अपनी दवा की दिनचर्या को सुरक्षित और व्यवस्थित रखने के लिए आवश्यक सब कुछ।',
      card1Title: 'दवाएं प्रबंधित करें',
      card1Desc: 'अपनी वर्तमान दवाओं को एक स्वच्छ, केंद्रीकृत कैबिनेट में व्यवस्थित रखें।',
      card2Title: 'दवा सुरक्षा जांचें',
      card2Desc: 'संभावित सुरक्षा चिंताओं के लिए अपने सक्रिय नुस्खों और सप्लीमेंट्स की समीक्षा करें।',
      card3Title: 'इंटरैक्शन समझें',
      card3Desc: 'संभावित दवा इंटरैक्शन की पहचान होने पर स्पष्ट, रोगी-अनुकूल स्पष्टीकरण प्राप्त करें।',
      card4Title: 'सरल, समझने योग्य परिणाम',
      card4Desc: 'जटिल चिकित्सा डेटा को आसानी से समझ में आने वाले मार्गदर्शन में बदलें।',
      howTitle: 'यह कैसे काम करता है',
      howSubtitle: 'स्मार्ट दवा प्रबंधन के लिए तीन सरल कदम।',
      step1Num: '01',
      step1Title: 'दवाएं जोड़ें',
      step1Desc: 'अपने सक्रिय दैनिक नुस्खों और सप्लीमेंट्स को अपने कैबिनेट में दर्ज करें।',
      step2Num: '02',
      step2Title: 'सुरक्षा जांच चलाएं',
      step2Desc: 'सत्यापित दवा इंटरैक्शन डेटाबेस के विरुद्ध अपनी पूरी दवा सूची की जांच करें।',
      step3Num: '03',
      step3Title: 'परिणाम समझें',
      step3Desc: 'स्पष्ट सुरक्षा चेतावनियाँ, जोखिम वर्गीकरण और कार्रवाई योग्य मार्गदर्शन प्राप्त करें।',
      previewTitle: 'स्पष्टता और मानसिक शांति के लिए निर्मित',
      previewSubtitle: 'पूर्वावलोकन करें कि कैसे MediGuard आपकी दवाओं को व्यवस्थित करता है।',
      previewCabinetTitle: 'वर्तमान दवाएं',
      previewSafetyTitle: 'सुरक्षा अवलोकन',
      previewSafeStatus: '✓ कोई प्रमुख इंटरैक्शन नहीं पाया गया',
      disclaimer: 'MediGuard दवा संबंधी जानकारी और सुरक्षा अंतर्दृष्टि प्रदान करने के लिए डिज़ाइन किया गया है। यह पेशेवर चिकित्सा सलाह का स्थान नहीं लेता है।',
      bottomCtaTitle: 'अपनी दवा सुरक्षा को अधिक स्पष्टता से देखें।',
      footerDesc: 'दवा प्रबंधन और सुरक्षा अंतर्दृष्टि, जटिल जानकारी को समझने में आसान बनाने के लिए डिज़ाइन की गई है।',
      copyright: '© 2026 MediGuard. सर्वाधिकार सुरक्षित।',
    },
  };

  const t = content[activeLang];

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
            {t.navHome}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('features')}>
            {t.navFeatures}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('how-it-works')}>
            {t.navHowItWorks}
          </button>
          <button type="button" className="nav-link-btn" onClick={() => scrollToSection('preview')}>
            {t.navPreview}
          </button>
        </div>

        <div className="landing-nav-actions">
          {/* Language Toggle */}
          <div className="lang-toggle-pill">
            <button
              type="button"
              className={`lang-btn ${activeLang === 'en' ? 'active' : ''}`}
              onClick={() => setActiveLang('en')}
            >
              English
            </button>
            <button
              type="button"
              className={`lang-btn ${activeLang === 'hi' ? 'active' : ''}`}
              onClick={() => setActiveLang('hi')}
            >
              हिन्दी
            </button>
          </div>

          <button type="button" className="nav-secondary-btn" onClick={onNavigateToLogin}>
            {t.login}
          </button>
          <button type="button" className="nav-primary-btn" onClick={onNavigateToSignup}>
            {t.getStarted}
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="landing-hero-section">
        <div className="hero-content-left">
          <div className="hero-badge-pill">
            <span>{t.badge}</span>
          </div>

          <h1 className="hero-main-title">
            <span className="title-block">{t.title1}</span>
            <span className="title-block title-highlight">{t.title2}</span>
            <span className="title-block">{t.title3}</span>
          </h1>

          <p className="hero-subtitle">{t.subtitle}</p>

          <div className="hero-cta-group">
            <button type="button" className="hero-primary-cta" onClick={onNavigateToSignup}>
              {t.getStarted}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button type="button" className="hero-secondary-cta" onClick={onNavigateToLogin}>
              {t.login}
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
              <span className="visual-header-title">MediGuard Safety Check</span>
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
                  <span className="status-title">Safety Status</span>
                </div>
                <span className="status-text">✓ Interaction engine active & verified</span>
              </div>
            </div>
          </div>

          {/* Floating UI Badges */}
          <div className="floating-badge badge-top-right">
            <span className="badge-icon">✓</span>
            <span className="badge-text">100% Patient Centric</span>
          </div>
          <div className="floating-badge badge-bottom-left">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">Instant Interaction Screening</span>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT VALUE SECTION */}
      <section id="features" className="landing-section features-section">
        <div className="section-header">
          <h2 className="section-title">{t.whyTitle}</h2>
          <p className="section-subtitle">{t.whySubtitle}</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-circle icon-red">💊</div>
            <h3 className="feature-card-title">{t.card1Title}</h3>
            <p className="feature-card-desc">{t.card1Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-shield">🛡️</div>
            <h3 className="feature-card-title">{t.card2Title}</h3>
            <p className="feature-card-desc">{t.card2Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-warning">⚠️</div>
            <h3 className="feature-card-title">{t.card3Title}</h3>
            <p className="feature-card-desc">{t.card3Desc}</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-circle icon-check">✓</div>
            <h3 className="feature-card-title">{t.card4Title}</h3>
            <p className="feature-card-desc">{t.card4Desc}</p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-section how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">{t.howTitle}</h2>
          <p className="section-subtitle">{t.howSubtitle}</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number-badge">{t.step1Num}</div>
            <div className="step-icon">📋</div>
            <h3 className="step-title">{t.step1Title}</h3>
            <p className="step-desc">{t.step1Desc}</p>
          </div>

          <div className="step-connector-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="step-card">
            <div className="step-number-badge">{t.step2Num}</div>
            <div className="step-icon">🔍</div>
            <h3 className="step-title">{t.step2Title}</h3>
            <p className="step-desc">{t.step2Desc}</p>
          </div>

          <div className="step-connector-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>

          <div className="step-card">
            <div className="step-number-badge">{t.step3Num}</div>
            <div className="step-icon">📊</div>
            <h3 className="step-title">{t.step3Title}</h3>
            <p className="step-desc">{t.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT PREVIEW SECTION */}
      <section id="preview" className="landing-section preview-section">
        <div className="section-header">
          <h2 className="section-title">{t.previewTitle}</h2>
          <p className="section-subtitle">{t.previewSubtitle}</p>
        </div>

        <div className="preview-app-shell">
          <div className="preview-app-header">
            <span className="preview-brand-tag">MediGuard Safety Network</span>
            <span className="preview-user-tag">👤 Demo Profile</span>
          </div>

          <div className="preview-app-grid">
            {/* Cabinet Preview */}
            <div className="preview-card cabinet-preview">
              <div className="card-preview-header">
                <h3>{t.previewCabinetTitle}</h3>
                <span className="preview-count">3 medicines</span>
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
                <h3>{t.previewSafetyTitle}</h3>
                <span className="preview-status-pill">{t.previewSafeStatus}</span>
              </div>
              <div className="preview-safety-body">
                <div className="stat-pill safe">
                  <span className="stat-num">0</span>
                  <span className="stat-label">Severe Warnings</span>
                </div>
                <div className="stat-pill moderate">
                  <span className="stat-num">0</span>
                  <span className="stat-label">Moderate Warnings</span>
                </div>
                <div className="stat-pill ok">
                  <span className="stat-num">3</span>
                  <span className="stat-label">Checked Safe</span>
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
          <p className="disclaimer-text">{t.disclaimer}</p>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="landing-bottom-cta">
        <div className="bottom-cta-card">
          <h2 className="bottom-cta-title">{t.bottomCtaTitle}</h2>
          <div className="bottom-cta-buttons">
            <button type="button" className="hero-primary-cta" onClick={onNavigateToSignup}>
              {t.getStarted}
            </button>
            <div className="already-account-wrap">
              <span className="already-text">{t.alreadyAccount}</span>
              <button type="button" className="already-link" onClick={onNavigateToLogin}>
                {t.login}
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

          <p className="footer-desc">{t.footerDesc}</p>

          <div className="footer-links">
            <button type="button" onClick={() => scrollToSection('hero')}>{t.navHome}</button>
            <button type="button" onClick={() => scrollToSection('features')}>{t.navFeatures}</button>
            <button type="button" onClick={() => scrollToSection('how-it-works')}>{t.navHowItWorks}</button>
            <button type="button" onClick={onNavigateToLogin}>{t.login}</button>
            <button type="button" onClick={onNavigateToSignup}>{t.getStarted}</button>
          </div>

          <p className="footer-copyright">{t.copyright}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
