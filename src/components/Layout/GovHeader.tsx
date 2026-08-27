import React from 'react';
import { Settings, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function GovHeader() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const setFontSize = (size: 'small' | 'normal' | 'large') => {
    const html = document.documentElement;
    if (size === 'small') html.style.fontSize = '14px';
    else if (size === 'large') html.style.fontSize = '18px';
    else html.style.fontSize = '16px';
  };

  const toggleHighContrast = (e: React.MouseEvent) => {
    e.preventDefault();
    document.body.classList.toggle('high-contrast');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as 'en' | 'hi');
  };

  return (
    <header className="gov-header">
      {/* Top Accessibility Bar */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="topbar-left">
            <span>{t('gov.india')}</span>
          </div>
          <div className="topbar-right">
            <a href="#main-content">{t('gov.skip')}</a>
            <a href="#" onClick={toggleHighContrast} title="Toggle High Contrast Mode"><Eye size={14}/> {t('gov.screenReader')}</a>
            <div className="font-size-controls">
              <button onClick={() => setFontSize('small')} title="Decrease Font Size">A-</button>
              <button onClick={() => setFontSize('normal')} title="Normal Font Size">A</button>
              <button onClick={() => setFontSize('large')} title="Increase Font Size">A+</button>
            </div>
            <div className="language-selector">
              <select value={lang} onChange={handleLanguageChange}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Brand Area */}
      <div className="gov-brand-area">
        <div className="brand-inner">
          <div className="brand-left" onClick={() => navigate('/')}>
            <img src="/src/assets/national_emblem.jpg" alt="Emblem of India" className="national-emblem" />
            <div className="brand-titles">
              <h1 className="ministry-title">{t('gov.ministry')}</h1>
              <h2 className="dept-title">{t('gov.dept')}</h2>
              <h3 className="app-title">{t('gov.app')}</h3>
            </div>
          </div>
          <div className="brand-right">
            <img src="/src/assets/jago_grahak_jago.jpg" alt="Jago Grahak Jago" className="gov-logo" />
            <img src="/src/assets/digital_india.jpg" alt="Digital India" className="gov-logo" />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="gov-navbar">
        <ul className="nav-links">
          <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>{t('nav.home')}</a></li>
          <li><a href="#">{t('nav.about')}</a></li>
          <li><a href="#">{t('nav.guidelines')}</a></li>
          <li><a href="#">{t('nav.circulars')}</a></li>
          <li><a href="#">{t('nav.contact')}</a></li>
        </ul>
      </nav>
    </header>
  );
}
