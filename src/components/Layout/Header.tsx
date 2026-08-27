import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Header() {
  const location = useLocation();
  const { t } = useLanguage();
  
  // Format the path to a readable title
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path || path === 'dashboard') return t('sidebar.dashboard');
    
    // Map paths to translation keys where possible
    const keyMap: Record<string, string> = {
      'scan': 'sidebar.newScan',
      'history': 'sidebar.history',
      'analytics': 'sidebar.analytics',
      'rules': 'sidebar.rules',
    };
    
    if (keyMap[path]) {
      return t(keyMap[path]);
    }
    
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  return (
    <header className="header">
      <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
        {getPageTitle()}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
          />
          <input 
            type="text" 
            placeholder={t('nav.home') === 'Home' ? 'Search...' : 'खोजें...'} 
            className="form-input" 
            style={{ paddingLeft: 36, width: 250, height: 36, borderRadius: 'var(--radius-full)' }} 
          />
        </div>
        
        <button className="btn btn-icon btn-ghost" style={{ position: 'relative' }}>
          <Bell size={20} />
          <span style={{ 
            position: 'absolute', top: 8, right: 8, 
            width: 8, height: 8, borderRadius: '50%', 
            background: 'var(--danger-500)', border: '2px solid var(--bg-surface)' 
          }} />
        </button>
      </div>
    </header>
  );
}
