import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { Camera } from '@capacitor/camera';
import { assetService } from '@/services';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';

export const AssetScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const perm = await Camera.requestPermissions({ permissions: ['camera'] });
        if (perm.camera !== 'granted') {
          setError('Izin kamera ditolak. Aktifkan di Settings > App > HiMup Field.');
          return;
        }

        if (!mounted) return;

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const codeReader = new BrowserMultiFormatReader();
        controlsRef.current = await codeReader.decodeFromConstraints(
          { 
            audio: false, 
            video: { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          },
          videoElement,
          (result, error) => {
            if (result) {
              if (controlsRef.current) {
                controlsRef.current.stop();
              }
              handleFound(result.getText());
            }
          }
        );
        setIsScanning(true);
      } catch (err: any) {
        setError(err?.message || 'Gagal memulai kamera langsung.');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  const handleFound = async (rawTag: string) => {
    setLoading(true);
    setError('');
    
    // Extract asset tag if the scanned string is a URL (e.g., from QR Code)
    let tag = rawTag;
    if (tag.includes('/asset/')) {
      const parts = tag.split('/asset/');
      if (parts.length > 1) {
        tag = parts[1].split('/')[0];
      }
    }

    try {
      const data = await assetService.getByTag(tag);
      const asset = data?.data?.[0] || (Array.isArray(data) ? data[0] : null);
      if (asset) {
        navigate(`/assets/${asset.id}`, { replace: true });
      } else {
        setError(`Tidak ditemukan aset dengan tag: "${tag}"`);
        setLoading(false);
        // Resume scanning if not found? Might be good, but currently it stops.
      }
    } catch {
      setError('Pencarian gagal. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'env(safe-area-inset-top, 36px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#94a3b8" />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Scan Asset</div>
        </div>
      </div>

      {/* Main area - Camera View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
            <Loader2 size={40} color="#f97316" className="spin" style={{ marginBottom: 16 }} />
            <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>Memproses data aset...</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay playsInline muted></video>
            
            {/* Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', position: 'absolute', top: 40 }}>
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Arahkan kamera ke QR Code</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Pemindaian akan dilakukan secara otomatis</p>
              </div>
              
              {/* Target box for visual guidance */}
              <div style={{ width: 250, height: 250, border: '2px solid rgba(255,255,255,0.5)', borderRadius: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTop: '4px solid #f97316', borderLeft: '4px solid #f97316', borderRadius: '24px 0 0 0' }}></div>
                <div style={{ position: 'absolute', top: -2, right: -2, width: 40, height: 40, borderTop: '4px solid #f97316', borderRight: '4px solid #f97316', borderRadius: '0 24px 0 0' }}></div>
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 40, height: 40, borderBottom: '4px solid #f97316', borderLeft: '4px solid #f97316', borderRadius: '0 0 0 24px' }}></div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottom: '4px solid #f97316', borderRight: '4px solid #f97316', borderRadius: '0 0 24px 0' }}></div>
              </div>

              {error && (
                <div style={{ position: 'absolute', bottom: 40, background: 'rgba(239,68,68,0.9)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '90%', maxWidth: 360, pointerEvents: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <p style={{ fontSize: 13, color: '#fff', flex: 1 }}>{error}</p>
                  <button onClick={() => {
                    setError('');
                    window.location.reload(); // Quick fix to restart scanner
                  }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '6px 12px', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600 }}>Coba Lagi</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Manual input */}
      <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', zIndex: 10 }}>
        <p style={{ color: '#475569', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>Atau masukkan kode aset secara manual</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Contoh: AST-LTP-001"
            style={{ flex: 1, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#f8fafc', outline: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualInput.trim()) handleFound(manualInput.trim()); }}
            disabled={loading}
          />
          <button
            onClick={() => { if (manualInput.trim()) handleFound(manualInput.trim()); }}
            disabled={!manualInput.trim() || loading}
            style={{ padding: '0 20px', background: manualInput.trim() ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(30,41,59,0.8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: manualInput.trim() ? 'pointer' : 'default' }}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Cari'}
          </button>
        </div>
      </div>
    </div>
  );
};
