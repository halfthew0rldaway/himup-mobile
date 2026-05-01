import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, Camera as CameraIcon, X, Loader2 } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { assetService } from '@/services';

// Decode QR/barcode from an image data URL using html5-qrcode's file-based decoder
async function decodeFromDataUrl(dataUrl: string): Promise<string> {
  const { Html5Qrcode } = await import('html5-qrcode');
  return new Promise((resolve, reject) => {
    // Convert dataUrl to File blob for html5-qrcode's file-based API
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
        const reader = new Html5Qrcode('__decode_dummy__', { verbose: false });
        reader.scanFile(file, false)
          .then((result: string) => { reader.clear(); resolve(result); })
          .catch((e: any) => { reader.clear(); reject(e); });
      })
      .catch(reject);
  });
}

export const AssetScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleScan = async () => {
    setError('');
    setLoading(true);
    try {
      const perm = await Camera.requestPermissions({ permissions: ['camera'] });
      if (perm.camera !== 'granted') {
        setError('Izin kamera ditolak. Aktifkan di Settings > App > HiMup Field.');
        setLoading(false);
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      if (!photo.dataUrl) throw new Error('No image captured');
      setPreview(photo.dataUrl);

      let tag: string;
      try {
        tag = await decodeFromDataUrl(photo.dataUrl);
      } catch {
        setError('Tidak bisa membaca kode dari gambar ini. Coba lagi atau masukkan kode secara manual.');
        setLoading(false);
        return;
      }

      await handleFound(tag);
    } catch (e: any) {
      if (!e?.message?.includes('User cancelled')) {
        setError(e?.message || 'Kamera gagal dibuka.');
      }
      setLoading(false);
    }
  };

  const handleFound = async (tag: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await assetService.getByTag(tag);
      const asset = data?.data?.[0] || (Array.isArray(data) ? data[0] : null);
      if (asset) {
        navigate(`/assets/${asset.id}`, { replace: true });
      } else {
        setError(`Tidak ditemukan aset dengan tag: "${tag}"`);
        setLoading(false);
      }
    } catch {
      setError('Pencarian gagal. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {/* Header */}
      <div style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} color="#94a3b8" />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Scan Asset</div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24 }}>

        {/* Preview of captured image */}
        {preview && (
          <div style={{ position: 'relative', width: 200, height: 200, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(249,115,22,0.4)' }}>
            <img src={preview} alt="scan preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => setPreview(null)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={13} color="#fff" />
            </button>
          </div>
        )}

        {!preview && (
          <div style={{ width: 120, height: 120, background: 'rgba(30,41,59,0.9)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(249,115,22,0.15)' }}>
            <ScanLine size={52} color="rgba(249,115,22,0.5)" />
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Scan barcode / QR code aset</p>
          <p style={{ color: '#64748b', fontSize: 13 }}>Ambil foto label aset menggunakan kamera</p>
        </div>

        <button onClick={handleScan} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px', background: loading ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}>
          {loading ? <><Loader2 size={20} className="spin" /> Memproses…</> : <><CameraIcon size={20} />Buka Kamera</>}
        </button>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', maxWidth: 360 }}>
            <p style={{ fontSize: 13, color: '#fca5a5', flex: 1 }}>{error}</p>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}><X size={14} color="#f87171" /></button>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <p style={{ color: '#475569', fontSize: 12, marginBottom: 8, textAlign: 'center' }}>Atau masukkan kode aset secara manual</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Contoh: AST-LTP-001"
            style={{ flex: 1, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: '#f8fafc', outline: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && manualInput.trim()) handleFound(manualInput.trim()); }}
          />
          <button
            onClick={() => { if (manualInput.trim()) handleFound(manualInput.trim()); }}
            disabled={!manualInput.trim() || loading}
            style={{ padding: '0 20px', background: manualInput.trim() ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(30,41,59,0.8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: manualInput.trim() ? 'pointer' : 'default' }}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Cari'}
          </button>
        </div>
      </div>

      {/* Hidden div for html5-qrcode decode */}
      <div id="__decode_dummy__" style={{ display: 'none' }} />
    </div>
  );
};
