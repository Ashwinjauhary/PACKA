import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { generatePDF, downloadPDF } from '../lib/pdf-export';
import { ScanRecord } from '../types/scan';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  MinusCircle,
  Ruler,
  FileText,
  Image as ImageIcon,
  Shield,
  Clock,
  Package,
  Tag,
} from 'lucide-react';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      apiFetch(`/scans/${id}`)
        .then((data) => {
          setScan(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading report...</div>;
  }

  if (!scan) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><FileText /></div>
        <div className="empty-title">Scan not found</div>
        <div className="empty-text">The requested scan report could not be found.</div>
        <button className="btn btn-primary" onClick={() => navigate('/history')}>
          <ArrowLeft size={18} /> Go to History
        </button>
      </div>
    );
  }

  const handleExportPDF = async () => {
    const blob = await generatePDF(scan);
    downloadPDF(blob, `PACKA-Report-${scan.id}.pdf`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle size={16} />;
      case 'fail': return <XCircle size={16} />;
      case 'warn': return <AlertCircle size={16} />;
      default: return <MinusCircle size={16} />;
    }
  };

  const verdictClass =
    scan.verdict.status === 'compliant' ? 'compliant' :
    scan.verdict.status === 'non_compliant' ? 'non-compliant' : 'needs-review';

  const verdictLabel =
    scan.verdict.status === 'compliant' ? 'COMPLIANT' :
    scan.verdict.status === 'non_compliant' ? 'NON-COMPLIANT' : 'NEEDS REVIEW';

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="page-title">Compliance Report</div>
            <div className="page-subtitle">{scan.id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {scan.verdict.status === 'non_compliant' && (
            <button className="btn btn-secondary" onClick={async () => {
              try {
                const res = await apiFetch('/sync/ejagriti', {
                  method: 'POST',
                  body: JSON.stringify({ scanId: scan.id, violations: scan.violations, productInfo: scan.productInfo })
                });
                if (res.referenceNumber) {
                  alert(`[SIMULATION]\nData formatted and synced with e-Jagriti Mock Server.\nRef: ${res.referenceNumber}`);
                }
              } catch (e) {
                alert('Failed to sync to e-Jagriti');
              }
            }}>
              Sync to e-Jagriti (Simulated Demo)
            </button>
          )}
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Verdict Banner */}
      <div className={`verdict-banner ${verdictClass}`} style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="verdict-title" style={{
            color: scan.verdict.status === 'compliant' ? 'var(--success-400)' :
              scan.verdict.status === 'non_compliant' ? 'var(--danger-400)' : 'var(--warning-400)',
          }}>
            <Shield size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            {verdictLabel}
          </div>
          <div className="verdict-score" style={{
            color: scan.verdict.status === 'compliant' ? 'var(--success-400)' :
              scan.verdict.status === 'non_compliant' ? 'var(--danger-400)' : 'var(--warning-400)',
          }}>
            {scan.verdict.score}%
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', position: 'relative' }}>
            {scan.verdict.summary}
          </p>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 'var(--space-6)',
            marginTop: 'var(--space-4)', position: 'relative',
          }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>
              <CheckCircle size={14} style={{ color: 'var(--success-400)', display: 'inline', marginRight: 4 }} />
              {scan.verdict.passedChecks} Passed
            </span>
            <span style={{ fontSize: 'var(--text-sm)' }}>
              <XCircle size={14} style={{ color: 'var(--danger-400)', display: 'inline', marginRight: 4 }} />
              {scan.verdict.failedChecks} Failed
            </span>
            <span style={{ fontSize: 'var(--text-sm)' }}>
              <AlertCircle size={14} style={{ color: 'var(--warning-400)', display: 'inline', marginRight: 4 }} />
              {scan.verdict.warnings} Warnings
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              <MinusCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
              {scan.verdict.skipped} Skipped
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Scan Info */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} /> Product Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              ['Product', scan.productInfo.productName || 'N/A'],
              ['Brand', scan.productInfo.brandName || 'N/A'],
              ['Category', scan.productInfo.category],
              ['Scan Date', new Date(scan.timestamp).toLocaleString('en-IN')],
              ['Rule Version', scan.ruleVersion],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={18} /> Scanned Image
          </h3>
          <div style={{
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: '1px solid var(--border-subtle)', maxHeight: 250,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-base)',
          }}>
            <img src={scan.imageDataUrl} alt="Package" style={{ maxHeight: 250, objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Declaration-by-Declaration Results */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <div className="section-title">
            <Tag size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Declaration-by-Declaration Analysis
          </div>
        </div>

        <div className="declaration-grid stagger-children">
          {scan.results.map((result, idx) => (
            <div key={idx} className="glass-card declaration-card animate-slide-up">
              <div className={`declaration-status ${result.status}`}>
                {getStatusIcon(result.status)}
              </div>
              <div className="declaration-content">
                <div className="declaration-title">{result.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <span className={`badge badge-${
                    result.status === 'pass' ? 'success' :
                    result.status === 'fail' ? 'danger' :
                    result.status === 'warn' ? 'warning' : 'neutral'
                  }`} style={{ fontSize: '9px' }}>
                    {result.status.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {result.ruleClause}
                  </span>
                </div>
                <div className="declaration-detail">{result.details}</div>
                {result.extractedText && (
                  <div className="declaration-extracted">
                    {result.extractedText.substring(0, 120)}
                    {result.extractedText.length > 120 ? '...' : ''}
                  </div>
                )}
                {result.fontMeasurement && (
                  <div className="font-metric-row" style={{ marginTop: 'var(--space-2)' }}>
                    <Ruler size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span className="font-metric-label">Font Height:</span>
                    <div className="font-metric-values">
                      <span className="font-metric-measured" style={{
                        color: result.fontMeasurement.pass ? 'var(--success-400)' : 'var(--danger-400)',
                      }}>
                        {result.fontMeasurement.measuredHeightMm}mm
                      </span>
                      <span className="font-metric-divider">/</span>
                      <span className="font-metric-required">
                        {result.fontMeasurement.requiredHeightMm}mm req.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations */}
      {scan.violations.length > 0 && (
        <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
          <h3 style={{
            fontSize: 'var(--text-base)', fontWeight: 700,
            marginBottom: 'var(--space-4)', color: 'var(--danger-400)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <XCircle size={18} /> Violations Summary ({scan.violations.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {scan.violations.map((v, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: v.severity === 'error' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${v.severity === 'error' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                  fontWeight: 600, color: 'var(--primary-400)',
                  background: 'rgba(0, 212, 170, 0.1)',
                  padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'nowrap',
                }}>
                  {v.clause}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {v.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Raw Text */}
      <details className="glass-card" style={{ padding: 'var(--space-6)' }}>
        <summary style={{
          cursor: 'pointer', fontSize: 'var(--text-base)', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <FileText size={18} /> Raw OCR Text
        </summary>
        <pre style={{
          marginTop: 'var(--space-4)', padding: 'var(--space-4)',
          background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
          overflow: 'auto', maxHeight: 300,
        }}>
          {scan.ocrText}
        </pre>
      </details>

      {/* Footer Actions */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>
          <Clock size={18} /> All Scans
        </button>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" onClick={handleExportPDF}>
            <Download size={18} /> Export PDF
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/scan')}>
            New Scan
          </button>
        </div>
      </div>
    </div>
  );
}
