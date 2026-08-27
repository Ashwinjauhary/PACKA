import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import GovHeader from '../components/Layout/GovHeader';
import GovFooter from '../components/Layout/GovFooter';
import { useLanguage } from '../context/LanguageContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="landing-page">
      <GovHeader />
      
      <div id="main-content" className="landing-banner-area">
        <div className="banner-overlay">
          <h2>{t('landing.title')}</h2>
          <p>{t('landing.subtitle')}</p>
        </div>
      </div>

      <div className="landing-main-content">
        <div className="info-section">
          <h3>{t('landing.infoTitle')}</h3>
          <p className="mb-4">
            {t('landing.infoDesc')}
          </p>
          <ul className="circulars-list">
            <li>
              <span className="text-primary-500 font-bold">12-Aug-2026</span>
              <a href="https://consumeraffairs.nic.in/acts-and-rules/legal-metrology" target="_blank" rel="noreferrer" className="hover:underline text-blue-800">Notification regarding mandatory declaration of Unit Sale Price on packaged commodities. <span className="new-badge">NEW</span></a>
            </li>
            <li>
              <span className="text-primary-500 font-bold">05-May-2026</span>
              <a href="https://consumeraffairs.nic.in/acts-and-rules/legal-metrology" target="_blank" rel="noreferrer" className="hover:underline text-blue-800">Advisory to e-commerce entities for displaying mandatory declarations online.</a>
            </li>
            <li>
              <span className="text-primary-500 font-bold">14-Jan-2026</span>
              <a href="https://consumeraffairs.nic.in/acts-and-rules/legal-metrology" target="_blank" rel="noreferrer" className="hover:underline text-blue-800">Amendments to Legal Metrology (Packaged Commodities) Rules, 2011.</a>
            </li>
          </ul>
        </div>

        <div className="action-cards">
          <div className="action-card">
            <h4>{t('landing.loginTitle')}</h4>
            <p className="text-sm text-gray-600 mb-4">{t('landing.loginDesc')}</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {t('landing.loginBtn')}
            </button>
            <p className="text-sm text-gray-600 mt-4 text-center">
              {t('landing.newUser')} <button onClick={() => navigate('/register')} className="text-blue-700 font-bold hover:underline ml-1">{t('landing.register')}</button>
            </p>
          </div>
          
          <div className="action-card mt-4 border-t-4 border-[var(--success-500)]">
            <h4>{t('landing.standardsTitle')}</h4>
            <p className="text-sm text-gray-600 mb-4">{t('landing.standardsDesc')}</p>
            <a 
              href="https://consumeraffairs.nic.in/acts-and-rules/legal-metrology"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                display: 'flex',
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                border: '1px solid var(--primary-200)'
              }}
            >
              {t('landing.viewRulebook')}
            </a>
          </div>
        </div>
      </div>
      
      <GovFooter />
    </div>
  );
}
