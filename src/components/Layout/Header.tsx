import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, AlertTriangle, Clock, Activity } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/api';
import { ScanRecord } from '../../types/scan';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch real notifications from database (Non-compliant scans)
  useEffect(() => {
    const fetchRealAlerts = async () => {
      try {
        const scans: ScanRecord[] = await apiFetch('/scans');

        // Filter out non-compliant scans for alerts
        const nonCompliant = scans
          .filter(s => s.verdict.status === 'non_compliant')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5); // Top 5 recent

        const mappedNotifs = nonCompliant.map(s => {
          const date = new Date(s.timestamp);
          const now = new Date();
          const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

          let timeStr = '';
          if (diffMins < 60) timeStr = `${diffMins} mins ago`;
          else if (diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)} hours ago`;
          else timeStr = `${Math.floor(diffMins / 1440)} days ago`;

          return {
            id: s.id,
            type: 'danger',
            text: `Non-compliant product detected: ${s.productInfo.productName || 'Unknown'} (${s.verdict.score}% Score)`,
            time: timeStr
          };
        });

        setRealNotifications(mappedNotifs);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchRealAlerts();

    // Poll every 30 seconds for new scans
    const interval = setInterval(fetchRealAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handler for notifications
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/history?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname.substring(1).split('/')[0];
    if (!path || path === 'dashboard') return t('sidebar.dashboard');

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
    <header className="header" style={{ position: 'relative', zIndex: 10 }}>
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
            placeholder={t('nav.home') === 'Home' ? 'Search history...' : 'इतिहास खोजें...'}
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            style={{ paddingLeft: 36, width: 250, height: 36, borderRadius: 'var(--radius-full)' }}
          />
        </div>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="btn btn-icon btn-ghost"
            style={{ position: 'relative' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {realNotifications.length > 0 && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--danger-500)', border: '2px solid var(--bg-surface)'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '320px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Real-Time Alerts</span>
                <span className="badge badge-danger">{realNotifications.length}</span>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {realNotifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    No active compliance violations.
                  </div>
                ) : (
                  realNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { setShowNotifications(false); navigate(`/report/${n.id}`); }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
                      className="hover-bg-muted"
                    >
                      <div style={{ marginTop: '2px' }}>
                        <AlertTriangle size={16} color="var(--danger-500)" />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <Clock size={10} />
                          <span>{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {realNotifications.length > 0 && (
                <div 
                  onClick={() => { setShowNotifications(false); navigate('/history'); }}
                  style={{ padding: '8px', textAlign: 'center', background: 'var(--bg-muted)', fontSize: '12px', color: 'var(--primary-600)', cursor: 'pointer', fontWeight: 500 }}
                >
                  View All Violations
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
