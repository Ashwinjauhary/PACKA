import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../lib/api';
import { ScanRecord } from '../types/scan';
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/scans').then((data) => {
      setScans(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const total = scans.length;
  const compliant = scans.filter((s) => s.verdict.status === 'compliant').length;
  const nonCompliant = scans.filter((s) => s.verdict.status === 'non_compliant').length;
  const needsReview = scans.filter((s) => s.verdict.status === 'needs_review').length;
  const avgScore = total > 0 ? Math.round(scans.reduce((sum, s) => sum + s.verdict.score, 0) / total) : 0;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
  
  const violationCounts: Record<string, number> = {};
  scans.forEach((s) => {
    s.results.forEach((r) => {
      if (r.status === 'fail') {
        violationCounts[r.label] = (violationCounts[r.label] || 0) + 1;
      }
    });
  });

  const recentScans = scans.slice(0, 5);

  const statCards = [
    {
      icon: <ScanLine />, iconClass: 'primary',
      value: total, label: t('dashboard.totalScans'),
    },
    {
      icon: <ShieldCheck />, iconClass: 'success',
      value: `${complianceRate}%`, label: t('dashboard.complianceRate'),
    },
    {
      icon: <AlertTriangle />, iconClass: 'danger',
      value: nonCompliant, label: t('dashboard.nonCompliant'),
    },
    {
      icon: <TrendingUp />, iconClass: 'warning',
      value: avgScore, label: t('dashboard.avgScore'),
    },
  ];

  const getVerdictBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="badge badge-success"><CheckCircle size={10} /> Compliant</span>;
      case 'non_compliant':
        return <span className="badge badge-danger"><XCircle size={10} /> Non-Compliant</span>;
      default:
        return <span className="badge badge-warning"><AlertCircle size={10} /> Needs Review</span>;
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div className="page-content animate-slide-up">
      <div className="page-header">
        <div>
          <div className="page-title">
            {t('dashboard.welcome')}, {user?.name?.split(' ')[0] || 'Officer'} 👋
          </div>
          <div className="page-subtitle">
            {t('dashboard.subtitle')}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/scan')}>
          <ScanLine size={18} />
          {t('sidebar.newScan')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-8)' }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card stat-card animate-slide-up">
            <div className={`stat-icon ${card.iconClass}`}>{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Recent Scans */}
        <div className="glass-card" style={{ gridColumn: recentScans.length === 0 ? '1 / -1' : undefined }}>
          <div className="chart-header" style={{ padding: 'var(--space-6) var(--space-6) 0' }}>
            <div className="chart-title">{t('dashboard.recentScans')}</div>
            {recentScans.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
                {t('dashboard.viewAll')} <ArrowRight size={14} />
              </button>
            )}
          </div>

          {recentScans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Package />
              </div>
              <div className="empty-title">{t('dashboard.noScans')}</div>
              <div className="empty-text">
                {t('dashboard.noScansDesc')}
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/scan')}>
                <ScanLine size={18} />
                {t('dashboard.startScan')}
              </button>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-4) var(--space-6) var(--space-6)' }}>
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => navigate(`/report/${scan.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                    marginBottom: 'var(--space-1)',
                  }}
                  className="nav-item"
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0,
                  }}>
                    <img
                      src={scan.imageDataUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }} className="truncate">
                      {scan.productInfo.productName || scan.id}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      {new Date(scan.timestamp).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  {getVerdictBadge(scan.verdict.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Violation Breakdown */}
        {recentScans.length > 0 && (
          <div className="glass-card">
            <div className="chart-header" style={{ padding: 'var(--space-6) var(--space-6) 0' }}>
              <div className="chart-title">{t('dashboard.violationBreakdown')}</div>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-6) var(--space-6)' }}>
              {Object.entries(violationCounts).length > 0 ? (
                Object.entries(violationCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([label, count]) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      marginBottom: 'var(--space-3)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }} className="truncate">
                          {label}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, (count / Math.max(...Object.values(violationCounts))) * 100)}%`,
                              background: 'linear-gradient(90deg, var(--danger-500), var(--warning-500))',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 'var(--text-sm)', fontWeight: 700,
                        fontFamily: 'var(--font-mono)', color: 'var(--danger-400)',
                        minWidth: 24, textAlign: 'right',
                      }}>
                        {count}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <div className="empty-icon" style={{ width: 48, height: 48 }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="empty-title" style={{ fontSize: 'var(--text-sm)' }}>{t('dashboard.noViolations')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <div className="section-header">
          <div className="section-title">{t('dashboard.quickActions')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { icon: <ScanLine />, label: t('dashboard.scanPackage'), desc: t('dashboard.scanDesc'), path: '/scan', color: 'var(--primary-500)' },
            { icon: <Package />, label: t('sidebar.history'), desc: t('dashboard.historyDesc'), path: '/history', color: 'var(--secondary-500)' },
            { icon: <TrendingUp />, label: t('sidebar.analytics'), desc: t('dashboard.analyticsDesc'), path: '/analytics', color: 'var(--warning-500)' },
          ].map((action) => (
            <div
              key={action.path}
              className="glass-card"
              onClick={() => navigate(action.path)}
              style={{
                padding: 'var(--space-5)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                background: `${action.color}15`, color: action.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{action.label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{action.desc}</div>
              </div>
              <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
