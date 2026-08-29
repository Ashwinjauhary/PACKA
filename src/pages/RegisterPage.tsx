import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/Layout/AuthLayout';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    organization_name: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'officer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError(t('register.passMismatch'));
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
          organization_name: formData.organization_name,
          name: formData.full_name,
          role: formData.role
        })
      });
      
      // Show success message and wait before redirecting
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('register.title')} 
      subtitle={t('register.subtitle')}
    >
      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label" htmlFor="role">User Role</label>
          <select
            id="role"
            name="role"
            required
            className="form-input"
            value={formData.role}
            onChange={handleChange}
            style={{ backgroundColor: '#fff' }}
          >
            <option value="officer">Legal Metrology Officer (LMO)</option>
            <option value="ecommerce">E-Commerce Compliance Partner</option>
            <option value="manufacturer">Manufacturer / Packer</option>
            <option value="admin">System Administrator</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="organization_name">{t('register.org')}</label>
          <input
            id="organization_name"
            name="organization_name"
            type="text"
            required
            className="form-input"
            value={formData.organization_name}
            onChange={handleChange}
            placeholder={t('register.orgPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="full_name">{t('register.name')}</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="form-input"
            value={formData.full_name}
            onChange={handleChange}
            placeholder={t('register.namePlaceholder')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">{t('login.email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('login.emailPlaceholder')}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('login.passwordPlaceholder')}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirm_password">{t('register.confirmPass')}</label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            className="form-input"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder={t('login.passwordPlaceholder')}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || success}
          className={`btn ${success ? 'btn-success' : 'btn-primary'}`}
          style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
        >
          {success ? 'Account Created Successfully! Redirecting...' : loading ? t('register.loading') : t('register.btn')}
        </button>

        <div className="auth-footer">
          {t('register.hasAccount')} <Link to="/login" className="text-blue-800 hover:underline">{t('register.loginLink')}</Link>
        </div>
        
        <div className="login-gov-badge">
          By registering, you agree to the Terms & Conditions of the Ministry.
        </div>
      </form>
    </AuthLayout>
  );
}
