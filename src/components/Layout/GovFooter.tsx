import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function GovFooter() {
  const { t } = useLanguage();

  return (
    <footer className="gov-footer">
      <div className="footer-top">
        <div className="footer-inner">
          <div className="footer-column">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              <li><a href="#">{t('footer.home')}</a></li>
              <li><a href="#">{t('footer.aboutDept')}</a></li>
              <li><a href="#">{t('footer.lmRules')}</a></li>
              <li><a href="#">{t('footer.grievance')}</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>{t('footer.policies')}</h4>
            <ul>
              <li><a href="#">{t('footer.websitePolicies')}</a></li>
              <li><a href="#">{t('footer.disclaimer')}</a></li>
              <li><a href="#">{t('footer.privacy')}</a></li>
              <li><a href="#">{t('footer.terms')}</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>{t('footer.contact')}</h4>
            <p>{t('footer.address')}</p>
            <p>{t('footer.email')}</p>
            <p>{t('footer.helpline')}</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{t('footer.copyright')}</p>
      </div>
    </footer>
  );
}
