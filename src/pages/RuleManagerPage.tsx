import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import lmpcRules from '../config/lmpc-rules.json';
import {
  Settings,
  Shield,
  BookOpen,
  Ruler,
  Tag,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function RuleManagerPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  const rules = useMemo(() => lmpcRules.rules, []);
  const thresholds = useMemo(() => lmpcRules.fontSizeThresholds, []);
  const exemptions = useMemo(() => lmpcRules.exemptions, []);
  const categories = useMemo(() => lmpcRules.categories, []);

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Lock /></div>
        <div className="empty-title">Access Restricted</div>
        <div className="empty-text">
          The Rule Manager is only available to Supervisors and Administrators.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <div className="page-title">Rule Manager</div>
          <div className="page-subtitle">
            LMPC Rules, 2011 — Version {lmpcRules.version} • {lmpcRules.amendments.length} amendments
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <span className="badge badge-success">
            <Shield size={10} /> Active
          </span>
          <span className="badge badge-neutral">
            v{lmpcRules.version}
          </span>
        </div>
      </div>

      {/* Rule Version Info */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} /> Rule Set Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Version</div>
            <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{lmpcRules.version}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Effective Date</div>
            <div style={{ fontWeight: 600 }}>{lmpcRules.effectiveDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Active Rules</div>
            <div style={{ fontWeight: 600 }}>{rules.filter(r => r.active).length} / {rules.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Amendments</div>
            <div style={{ fontWeight: 600 }}>{lmpcRules.amendments.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* Declaration Rules */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={18} /> Declaration Rules ({rules.length})
        </h3>
        <div className="rule-list">
          {rules.map((rule) => (
            <div key={rule.id} className="glass-card rule-item">
              <span className="rule-id">{rule.id}</span>
              <div className="rule-content">
                <div className="rule-title">{rule.description}</div>
                <div className="rule-clause">
                  {rule.clause} • Check: {rule.check} • {rule.required ? 'Mandatory' : 'Conditional'}
                </div>
                {rule.format && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                    Format: {rule.format}
                  </div>
                )}
              </div>
              <span className={`badge ${rule.active ? 'badge-success' : 'badge-neutral'}`}>
                {rule.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Font Size Thresholds */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ruler size={18} /> Font Size Thresholds (Rule 8)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>PDP Area Range</th>
                <th>Min Letter Height</th>
                <th>Min Numeral Height</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map((t, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                    {t.pdpAreaMinCmSq} — {t.pdpAreaMaxCmSq >= 999999 ? '∞' : t.pdpAreaMaxCmSq} cm²
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.minLetterHeightMm} mm</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.minNumeralHeightMm} mm</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exemptions */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning-400)' }} /> Exemptions ({exemptions.length})
        </h3>
        {exemptions.map((ex) => (
          <div key={ex.id} style={{
            padding: 'var(--space-4)', background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
              <span className="rule-id">{ex.id}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{ex.clause}</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{ex.description}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
              Condition: {ex.condition}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Affects: {ex.affectedFields.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} /> Product Categories ({categories.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{
              padding: 'var(--space-4)', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>{cat.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                Required: {cat.requiredFields.length} fields
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cat.requiredFields.map((f) => (
                  <span key={f} className="badge badge-success" style={{ fontSize: '9px' }}>{f}</span>
                ))}
                {cat.conditionalFields.map((f) => (
                  <span key={f} className="badge badge-neutral" style={{ fontSize: '9px' }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
