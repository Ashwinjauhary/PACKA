import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFilter, ScanRecord } from '../types/scan';
import { apiFetch } from '../lib/api';
import {
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [allScans, setAllScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchScans = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/scans');
      setAllScans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const [filters, setFilters] = useState<ScanFilter>({
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    verdict: '',
    category: '',
  });

  const filteredScans = useMemo(() => {
    let scans = allScans;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      scans = scans.filter(
        (s) =>
          s.productInfo.productName?.toLowerCase().includes(q) ||
          s.productInfo.brandName?.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    if (filters.verdict) {
      scans = scans.filter((s) => s.verdict.status === filters.verdict);
    }
    if (filters.category) {
      scans = scans.filter((s) => s.productInfo.category === filters.category);
    }

    return scans;
  }, [allScans, filters]);

  const handleDelete = async (id: string) => {
    // For MVP, we aren't implementing delete on backend yet, but we'll mock it
    if (confirm('Delete this scan record? (Mocked)')) {
      setAllScans((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const getVerdictBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <span className="badge badge-success"><CheckCircle size={10} /> Compliant</span>;
      case 'non_compliant':
        return <span className="badge badge-danger"><XCircle size={10} /> Non-Compliant</span>;
      default:
        return <span className="badge badge-warning"><AlertCircle size={10} /> Review</span>;
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading history...</div>;
  }

  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--danger-400)' }}>Error: {error}</div>;
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div>
          <div className="page-title">Scan History</div>
          <div className="page-subtitle">{filteredScans.length} records found</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            className="form-input"
            placeholder="Search by product, brand, or scan ID..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          />
        </div>
        <select
          className="form-select"
          value={filters.verdict}
          onChange={(e) => setFilters({ ...filters, verdict: e.target.value as ScanFilter['verdict'] })}
          style={{ minWidth: 150 }}
        >
          <option value="">All Verdicts</option>
          <option value="compliant">Compliant</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="needs_review">Needs Review</option>
        </select>
        <select
          className="form-select"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          style={{ minWidth: 150 }}
        >
          <option value="">All Categories</option>
          <option value="food">Food / FMCG</option>
          <option value="cosmetics">Cosmetics</option>
          <option value="electronics">Electronics</option>
          <option value="apparel">Apparel</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Table */}
      {filteredScans.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-icon"><Package /></div>
            <div className="empty-title">No scans found</div>
            <div className="empty-text">
              {allScans.length === 0
                ? 'Start scanning packages to build your compliance history.'
                : 'No results match your current filters.'}
            </div>
            {allScans.length === 0 && (
              <button className="btn btn-primary" onClick={() => navigate('/scan')}>
                Start Scanning
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image Name</th>
                  <th>Scan ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Verdict</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                        {scan.imageName || 'Unknown'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--primary-400)' }}>
                        {scan.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{scan.productInfo.productName || '—'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {scan.productInfo.brandName || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{scan.productInfo.category}</span>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: scan.verdict.score >= 80 ? 'var(--success-400)' :
                          scan.verdict.score >= 50 ? 'var(--warning-400)' : 'var(--danger-400)',
                      }}>
                        {scan.verdict.score}%
                      </span>
                    </td>
                    <td>{getVerdictBadge(scan.verdict.status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <Clock size={12} />
                        {new Date(scan.timestamp).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/report/${scan.id}`)}
                          title="View Report"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(scan.id)}
                          title="Delete"
                          style={{ color: 'var(--danger-400)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
