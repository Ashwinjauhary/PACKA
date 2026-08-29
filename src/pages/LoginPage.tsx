import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/Layout/AuthLayout';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: email, password })
      });
      
      setSuccess(true);
      login(data.token, data.user);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleGovtSSO = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Parichay / MeriPehchaan SSO integration requires government API credentials and is scheduled for Phase 2. Please use standard email/password login for now.');
  };

  return (
    <AuthLayout 
      title={t('login.title')} 
      subtitle={t('login.subtitle')}
    >
      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label" htmlFor="email">{t('login.email')}</label>
          <input
            id="email"
            type="email"
            required
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            type="password"
            required
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || success}
          className={`btn ${success ? 'btn-success' : 'btn-primary'}`}
          style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
        >
          {success ? 'Login Successful! Redirecting...' : loading ? t('login.loading') : t('login.btn')}
        </button>

        <div style={{ textAlign: 'center', margin: '15px 0', color: '#666', fontSize: '0.85rem' }}>
          — OR —
        </div>

        <button
          type="button"
          onClick={handleGovtSSO}
          className="btn btn-outline"
          style={{ width: '100%', justifyContent: 'center', borderColor: '#004B87', color: '#004B87' }}
        >
          Login with Parichay / MeriPehchaan (SSO)
        </button>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          {t('login.noAccount')} <Link to="/register" className="text-blue-800 hover:underline">{t('login.registerLink')}</Link>
        </div>
        
        <div className="login-gov-badge">
          {t('login.badge')}
        </div>
      </form>
    </AuthLayout>
  );
}
