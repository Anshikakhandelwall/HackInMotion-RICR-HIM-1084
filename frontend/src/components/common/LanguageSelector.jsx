import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSelector.css';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const currentLabel = language === 'hi' ? 'हिन्दी' : 'English';

  return (
    <div className="mediguard-lang-selector" ref={dropdownRef}>
      <button
        type="button"
        className="lang-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="lang-icon">🌐</span>
        <span className="lang-label">{currentLabel}</span>
        <span className={`lang-arrow ${isOpen ? 'up' : 'down'}`}>▾</span>
      </button>

      {isOpen && (
        <ul className="lang-dropdown-menu">
          <li className={language === 'en' ? 'active' : ''}>
            <button type="button" className="lang-dropdown-item" onClick={() => handleSelect('en')}>
              English
            </button>
          </li>
          <li className={language === 'hi' ? 'active' : ''}>
            <button type="button" className="lang-dropdown-item" onClick={() => handleSelect('hi')}>
              हिन्दी
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
