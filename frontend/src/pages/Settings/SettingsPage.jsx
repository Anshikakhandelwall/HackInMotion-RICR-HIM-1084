import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const SettingsPage = () => {
  const { t } = useLanguage();

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#24201F' }}>{t('settingsTitle')}</h1>
        <p style={{ color: '#6E6462', fontSize: '0.875rem' }}>{t('settingsSubtitle')}</p>
      </div>

      <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '18px', border: '1px solid #E9DDD9', boxShadow: '0 12px 36px -8px rgba(166, 61, 53, 0.08)' }}>
        <p style={{ color: '#6E6462', textAlign: 'center', padding: '1.5rem 0' }}>
          ⚙️ <strong>{t('settingsPlaceholder')}</strong>
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;

