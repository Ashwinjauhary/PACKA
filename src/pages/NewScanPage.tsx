import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { ProductInfo, PackageDimensions } from '../types/scan';
import CameraCapture from '../components/CameraCapture';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Zap,
} from 'lucide-react';

type Step = 'upload' | 'info' | 'processing' | 'done';

export default function NewScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [imageName, setImageName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [productInfo, setProductInfo] = useState<ProductInfo>({
    productName: '',
    brandName: '',
    category: 'food',
  });

  const [dimensions, setDimensions] = useState<PackageDimensions>({
    shape: 'rectangular',
    widthCm: 15,
    heightCm: 20,
  });

  type ScanProgress = { stage: string; progress: number; stageLabel: string; };
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [scanId, setScanId] = useState('');

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      setStep('info');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleCameraCapture = (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    setImageName('camera-capture.jpg');
    setShowCamera(false);
    setStep('info');
  };

  const handleStartScan = async () => {
    setStep('processing');

    try {
      setProgress({ stage: 'processing', progress: 0.5, stageLabel: 'Waiting for AI Backend (This may take a few seconds)...' });

      // Convert Data URL to Blob
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      
      // Extract image pixel dimensions for accurate font metrology DPI calculation
      const img = new window.Image();
      img.src = imageDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const fullDimensions = {
        ...dimensions,
        widthPx: img.width,
        heightPx: img.height,
      };
      
      const formData = new FormData();
      formData.append('image', blob, imageName);
      formData.append('productInfoStr', JSON.stringify(productInfo));
      formData.append('dimensionsStr', JSON.stringify(fullDimensions));

      const result = await apiFetch('/scan', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header here, fetch will automatically set it to multipart/form-data with boundary
      });

      setProgress({ stage: 'report_generation', progress: 1, stageLabel: 'Report Ready' });

      setScanId(result.id);
      setStep('done');
    } catch (err) {
      console.error('Scan failed:', err);
      setStep('info');
    }
  };

  const STAGES = [
    { key: 'preprocessing', label: 'Image Pre-processing (OpenCV deskew & glare reduction)' },
    { key: 'segmentation', label: 'Computer Vision (YOLOv8 PDP Segmentation)' },
    { key: 'ocr', label: 'OCR Extraction (Tesseract/Cloud Vision)' },
    { key: 'classification', label: 'NLP Classification (Transformers NER)' },
    { key: 'font_analysis', label: 'Font Metrology Analysis' },
    { key: 'rule_evaluation', label: 'Rule Engine (Evaluating against LMPC Rules 2011 JSON Schema)' },
    { key: 'report_generation', label: 'Generating Compliance Report...' },
  ];

  return (
    <div className="animate-slide-up">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onCancel={() => setShowCamera(false)} 
        />
      )}
      <div className="page-header">
        <div>
          <div className="page-title">New Compliance Scan</div>
          <div className="page-subtitle">Upload or capture a package image to check LMPC compliance</div>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="scan-steps">
        {['Upload Image', 'Package Info', 'Processing', 'Report'].map((label, i) => {
          const steps: Step[] = ['upload', 'info', 'processing', 'done'];
          const currentIdx = steps.indexOf(step);
          const isActive = i === currentIdx;
          const isCompleted = i < currentIdx;
          return (
            <div key={label} className="scan-step">
              {i > 0 && <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />}
              <div className={`step-number ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {isCompleted ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`step-label ${isActive ? 'active' : ''}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card" style={{ padding: 'var(--space-8)' }}>
        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div className="animate-fade-in">
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <Upload />
              </div>
              <div className="upload-text">
                <div className="upload-title">
                  Drop package image here or click to browse
                </div>
                <div className="upload-subtitle">
                  Supports JPG, PNG, WEBP — Max 10MB
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 'var(--space-4)', marginTop: 'var(--space-6)',
            }}>
              <button className="btn btn-primary" onClick={() => setShowCamera(true)}>
                <Camera size={18} /> Use Camera
              </button>
            </div>
          </div>
        )}

        {/* INFO STEP */}
        {step === 'info' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
              {/* Image Preview */}
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                  <ImageIcon size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  Image Preview
                </h3>
                <div style={{
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  border: '1px solid var(--border-default)',
                  maxHeight: 400,
                }}>
                  <img src={imageDataUrl} alt="Package" style={{ width: '100%', objectFit: 'contain' }} />
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                  {imageName}
                </p>
              </div>

              {/* Product Info Form */}
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                  <Package size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                  Package Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Wheat Flour (Atta)"
                      value={productInfo.productName}
                      onChange={(e) => setProductInfo({ ...productInfo, productName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Tasty Bites"
                      value={productInfo.brandName}
                      onChange={(e) => setProductInfo({ ...productInfo, brandName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Category</label>
                    <select
                      className="form-select"
                      value={productInfo.category}
                      onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                    >
                      <option value="food">Packaged Food / FMCG</option>
                      <option value="cosmetics">Cosmetics & Personal Care</option>
                      <option value="electronics">Electronics & Appliances</option>
                      <option value="apparel">Apparel & Textiles</option>
                      <option value="general">General Merchandise</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Package Shape</label>
                      <select
                        className="form-select"
                        value={dimensions.shape}
                        onChange={(e) => setDimensions({
                          ...dimensions,
                          shape: e.target.value as PackageDimensions['shape'],
                        })}
                      >
                        <option value="rectangular">Rectangular / Box</option>
                        <option value="cylindrical">Cylindrical / Bottle</option>
                        <option value="other">Other / Irregular</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ 
                    padding: 'var(--space-3)', 
                    background: 'var(--primary-bg)', 
                    border: '1px solid var(--primary-border)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: 'var(--space-2)'
                  }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)', margin: 0, fontWeight: 500 }}>
                      <span style={{ fontWeight: 700 }}>Why do we need dimensions?</span> A flat 2D image doesn't have physical scale. We need physical dimensions to calculate the exact Font Size (in mm) as mandated by LMPC Rule 8. Weight and other details are read automatically by OCR.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Width (cm)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={dimensions.widthCm || ''}
                        onChange={(e) => setDimensions({ ...dimensions, widthCm: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Height (cm)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={dimensions.heightCm || ''}
                        onChange={(e) => setDimensions({ ...dimensions, heightCm: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <button className="btn btn-secondary" onClick={() => { setStep('upload'); setImageDataUrl(''); }}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleStartScan}>
                <Zap size={18} /> Run Compliance Scan
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className="processing-overlay animate-fade-in">
            <div className="processing-spinner" />
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Analyzing Package...
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              {progress?.stageLabel || 'Initializing...'}
            </p>

            <div className="progress-bar" style={{ maxWidth: 400, marginBottom: 'var(--space-6)' }}>
              <div
                className="progress-fill"
                style={{ width: `${(progress?.progress || 0) * 100}%` }}
              />
            </div>

            <div className="processing-steps" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div className="processing-step active">
                <Loader2 size={16} className="animate-pulse" />
                Communicating with YOLOv8 & Transformers NER backend...
              </div>
            </div>
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="animate-scale-in" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--success-bg)', border: '2px solid var(--success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-6)',
            }}>
              <CheckCircle size={40} style={{ color: 'var(--success-400)' }} />
            </div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
              Scan Complete!
            </h2>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-8)' }}>
              Your compliance report is ready for review.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/report/${scanId}`)}>
                View Report <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => { setStep('upload'); setImageDataUrl(''); }}>
                Scan Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
