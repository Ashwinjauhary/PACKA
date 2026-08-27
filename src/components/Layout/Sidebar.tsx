import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  ScanLine, 
  History, 
  BarChart3, 
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="stat-icon primary" style={{ width: 32, height: 32, margin: 0 }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1>PACKA</h1>
          <div className="logo-subtitle">{t('sidebar.subtitle')}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard />
          {t('sidebar.dashboard')}
        </NavLink>
        <NavLink 
          to="/scan" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ScanLine />
          {t('sidebar.newScan')}
        </NavLink>
        <NavLink 
          to="/history" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <History />
          {t('sidebar.history')}
        </NavLink>
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 />
          {t('sidebar.analytics')}
        </NavLink>
        <NavLink 
          to="/rules" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings />
          {t('sidebar.rules')}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'LMPC Officer'}</div>
            <div className="user-role">{user?.role || 'Admin'}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-icon btn-ghost" 
            title="Logout"
            style={{ color: 'var(--danger-500)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
