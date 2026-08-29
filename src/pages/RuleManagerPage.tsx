import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';

  const [lmpcRules, setLmpcRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchRules();
    }
  }, [isAdmin]);

  const fetchRules = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLmpcRules(data);
      } else {
        setError('Failed to fetch rules');
      }
    } catch (err) {
      setError('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    if (!lmpcRules || !isAdmin) return;
    
    setSaving(true);
    const updatedRules = {
      ...lmpcRules,
      rules: lmpcRules.rules.map((r: any) => 
        r.id === ruleId ? { ...r, active: !r.active } : r
      )
    };
    
    try {
      const res = await fetch('http://localhost:3001/api/rules', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedRules)
      });
      
      if (res.ok) {
        setLmpcRules(updatedRules);
      } else {
        alert('Failed to update rule');
      }
    } catch (err) {
      alert('Error updating rule');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) return <div style={{ padding: 'var(--space-6)' }}>Loading Rule Engine...</div>;
  if (error) return <div style={{ padding: 'var(--space-6)', color: 'red' }}>{error}</div>;
  if (!lmpcRules) return null;

  const rules = lmpcRules.rules;
  const thresholds = lmpcRules.fontSizeThresholds;
  const exemptions = lmpcRules.exemptions;
  const categories = lmpcRules.categories;

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
            <div style={{ fontWeight: 600 }}>{rules.filter((r: any) => r.active).length} / {rules.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Amendments</div>
            <div style={{ fontWeight: 600 }}>{lmpcRules.amendments.join(', ')}</div>
          </div>
        </div>
      </div>

      {/* Declaration Rules */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={18} /> Declaration Rules ({rules.length})</div>
          {saving && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Saving...</span>}
        </h3>
        <div className="rule-list">
          {rules.map((rule: any) => (
            <div key={rule.id} className="glass-card rule-item" style={{ opacity: rule.active ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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
              </div>
              <button 
                onClick={() => toggleRule(rule.id)}
                className="btn btn-secondary"
                disabled={saving}
              >
                {rule.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exemptions */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> Pre-Packaged Exemptions
        </h3>
        <div className="rule-list">
          {exemptions.map((ex: any, i: number) => (
            <div key={i} className="glass-card" style={{ padding: 'var(--space-3)', background: 'var(--bg-card-hover)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{ex.clause}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{ex.description}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
