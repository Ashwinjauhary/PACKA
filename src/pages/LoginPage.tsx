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
      
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
        >
          {loading ? t('login.loading') : t('login.btn')}
        </button>

        <div className="auth-footer">
          {t('login.noAccount')} <Link to="/register" className="text-blue-800 hover:underline">{t('login.registerLink')}</Link>
        </div>
        
        <div className="login-gov-badge">
          {t('login.badge')}
        </div>
      </form>
    </AuthLayout>
  );
}
