import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { ScanRecord } from '../types/scan';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Target,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/scans')
      .then((data) => {
        setScans(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const total = scans.length;
    const compliant = scans.filter((s) => s.verdict.status === 'compliant').length;
    const nonCompliant = scans.filter((s) => s.verdict.status === 'non_compliant').length;
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

    return {
      total,
      compliant,
      nonCompliant,
      avgScore,
      complianceRate,
      violationCounts,
    };
  }, [scans]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; compliant: number }> = {};
    scans.forEach((s) => {
      const cat = s.productInfo.category || 'general';
      if (!counts[cat]) counts[cat] = { total: 0, compliant: 0 };
      counts[cat].total++;
      if (s.verdict.status === 'compliant') counts[cat].compliant++;
    });
    return counts;
  }, [scans]);

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const buckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };
    scans.forEach((s) => {
      const score = s.verdict.score;
      if (score <= 25) buckets['0-25']++;
      else if (score <= 50) buckets['26-50']++;
      else if (score <= 75) buckets['51-75']++;
      else buckets['76-100']++;
    });
    return buckets;
  }, [scans]);

  const maxViolation = Math.max(...Object.values(stats.violationCounts), 1);

  if (scans.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="page-header">
          <div>
            <div className="page-title">Analytics</div>
            <div className="page-subtitle">Compliance trends and insights</div>
          </div>
        </div>
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon"><BarChart3 /></div>
            <div className="empty-title">No data yet</div>
            <div className="empty-text">
              Start scanning packages to see compliance analytics and trends.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Compliance trends and insights across {stats.total} scans</div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid stagger-children" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="glass-card stat-card animate-slide-up">
          <div className="stat-icon primary"><Target /></div>
          <div className="stat-value">{stats.complianceRate}%</div>
          <div className="stat-label">Overall Compliance Rate</div>
        </div>
        <div className="glass-card stat-card animate-slide-up">
          <div className="stat-icon success"><ShieldCheck /></div>
          <div className="stat-value">{stats.compliant}</div>
          <div className="stat-label">Compliant Products</div>
        </div>
        <div className="glass-card stat-card animate-slide-up">
          <div className="stat-icon danger"><AlertTriangle /></div>
          <div className="stat-value">{stats.nonCompliant}</div>
          <div className="stat-label">Non-Compliant Products</div>
        </div>
        <div className="glass-card stat-card animate-slide-up">
          <div className="stat-icon warning"><TrendingUp /></div>
          <div className="stat-value">{stats.avgScore}</div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* Violation Type Breakdown */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger-400)' }} />
            Top Violations
          </h3>
          {Object.entries(stats.violationCounts).length > 0 ? (
            Object.entries(stats.violationCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([label, count]) => (
                <div key={label} style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 'var(--text-xs)', marginBottom: 4,
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--danger-400)' }}>
                      {count}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(count / maxViolation) * 100}%`,
                        background: 'linear-gradient(90deg, var(--danger-500), var(--warning-500))',
                      }}
                    />
                  </div>
                </div>
              ))
          ) : (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-8)' }}>
              No violations recorded
            </p>
          )}
        </div>

        {/* Score Distribution */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-500)' }} />
            Score Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Object.entries(scoreDistribution).map(([range, count]) => {
              const maxCount = Math.max(...Object.values(scoreDistribution), 1);
              const colors: Record<string, string> = {
                '0-25': 'var(--danger-500)',
                '26-50': 'var(--warning-500)',
                '51-75': 'var(--secondary-500)',
                '76-100': 'var(--success-500)',
              };
              return (
                <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)', minWidth: 50, textAlign: 'right',
                  }}>
                    {range}%
                  </span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        background: colors[range],
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
                    fontWeight: 700, minWidth: 24, textAlign: 'right',
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <PieChart size={18} style={{ color: 'var(--secondary-400)' }} />
          Category-wise Compliance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          {Object.entries(categoryBreakdown).map(([cat, data]) => {
            const rate = data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0;
            return (
              <div key={cat} style={{
                padding: 'var(--space-5)', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  {cat}
                </div>
                <div style={{
                  fontSize: 'var(--text-2xl)', fontWeight: 800,
                  color: rate >= 75 ? 'var(--success-400)' : rate >= 50 ? 'var(--warning-400)' : 'var(--danger-400)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {rate}%
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {data.compliant}/{data.total} scans
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
