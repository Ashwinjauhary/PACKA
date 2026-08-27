import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        onCapture(dataUrl);
      }
      setIsCapturing(false);
    }
  };

  const retryCamera = () => {
    stopCamera();
    startCamera();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'white', margin: 0 }}>Capture Package Image</h3>
        <button className="btn btn-secondary" onClick={() => { stopCamera(); onCancel(); }} style={{ background: 'transparent', border: 'none', color: 'white' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {error ? (
          <div style={{ textAlign: 'center', color: 'white', padding: 'var(--space-8)' }}>
            <p style={{ color: 'var(--danger-400)', marginBottom: 'var(--space-4)' }}>{error}</p>
            <button className="btn btn-primary" onClick={retryCamera}>
              <RefreshCcw size={18} /> Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ padding: 'var(--space-6)', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-card)' }}>
        <button
          onClick={handleCapture}
          disabled={!!error || isCapturing}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: 'var(--primary-500)', border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            cursor: error || isCapturing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: error || isCapturing ? 0.5 : 1
          }}
        >
          <Camera size={32} color="white" />
        </button>
      </div>
    </div>
  );
}
