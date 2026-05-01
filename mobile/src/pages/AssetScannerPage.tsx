import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, X, Loader2 } from 'lucide-react';
import { Camera } from '@capacitor/camera';
import { assetService } from '@/services';

import { Html5Qrcode } from 'html5-qrcode';
export const AssetScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    let active = true;
    let html5QrCode: any = null;

    const start = async () => {
      try {
        const perm = await Camera.requestPermissions();
        if (perm.camera !== 'granted') {
          setError('Camera permission denied');
          return;
        }

        if (!active) return;
        setScanning(true);

        // Small delay to ensure the DOM element is ready
        setTimeout(() => {
          if (!active) return;
          try {
            html5QrCode = new Html5Qrcode('qr-reader');
            readerRef.current = html5QrCode;
            html5QrCode.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                if (active) handleFound(decodedText);
              },
              () => { /* Ignore standard scanning errors */ }
            ).catch(() => {
              if (active) setScanning(false);
            });
          } catch (e) {
            if (active) setScanning(false);
          }
        }, 300);

      } catch { setScanning(false); }
    };
    start();
    return () => {
      active = false;
      if (readerRef.current && readerRef.current.isScanning) {
        readerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleFound = async (tag: string) => {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const data = await assetService.getByTag(tag);
      const asset = data?.data?.[0] || (Array.isArray(data) ? data[0] : null);
      if (asset) navigate(`/assets/${asset.id}`, { replace: true });
      else { setError(`No asset found for tag: "${tag}"`); setLoading(false); }
    } catch { setError('Lookup failed. Try again.'); setLoading(false); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#94a3b8" />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Scan Asset</div>
        </div>
      </div>

      {/* Camera */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {scanning ? (
          <>
            <div id="qr-reader" style={{ width: '100%', height: '100%', minHeight: '60vh', objectFit: 'cover', background: '#000' }}></div>
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ position: 'absolute', bottom: '15%', color: 'rgba(255,255,255,0.8)', fontSize: 13, background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 20 }}>
                  Point camera at barcode or QR code
                </p>
              </div>
            </div>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <Loader2 size={40} color="#f97316" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#f1f5f9', fontSize: 14 }}>Looking up asset…</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, background: '#0f172a' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(30,41,59,0.9)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={36} color="#334155" />
            </div>
            <p style={{ color: '#64748b', fontSize: 14 }}>Camera not available</p>
            <p style={{ color: '#334155', fontSize: 13 }}>Enter the asset tag below</p>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: '#fca5a5' }}>{error}</p>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#f87171" /></button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter asset tag manually…"
            style={{ flex: 1, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#f8fafc', outline: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualInput.trim()) handleFound(manualInput.trim()); }}
          />
          <button
            onClick={() => { if (manualInput.trim()) handleFound(manualInput.trim()); }}
            disabled={!manualInput.trim() || loading}
            className="press-scale"
            style={{ padding: '0 20px', background: manualInput.trim() ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(30,41,59,0.8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: manualInput.trim() ? 'pointer' : 'default' }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Go'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
