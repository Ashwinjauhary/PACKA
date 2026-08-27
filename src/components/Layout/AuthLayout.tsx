import React from 'react';
import GovHeader from './GovHeader';
import GovFooter from './GovFooter';
import { useLanguage } from '../../context/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      <GovHeader />
      
      <div id="main-content" className="auth-layout">
        <div className="auth-graphic">
          <div className="graphic-content">
            <h2>{t('auth.instructionsTitle')}</h2>
            <ul className="instructions-list">
              <li>{t('auth.inst1')}</li>
              <li>{t('auth.inst2')}</li>
              <li>{t('auth.inst3')}</li>
              <li>{t('auth.inst4')}</li>
              <li>{t('auth.inst5')}</li>
            </ul>
          </div>
        </div>
        
        <div className="auth-content">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">{title}</h1>
              <p className="auth-subtitle">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
      
      <GovFooter />
    </div>
  );
}
