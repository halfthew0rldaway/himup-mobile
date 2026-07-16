import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { maintenanceService, assetService, branchService } from '@/services';
import { W, stickyHeader, primaryBtn } from '@/lib/design';

const inputStyle: React.CSSProperties = {
  width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`,
  borderRadius: 8, padding: '10px 12px', fontSize: 14, color: W.gray900, outline: 'none',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: W.gray700, marginBottom: 6 };

export const MaintenanceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const prefilledAssetId = searchParams.get('asset_id') || '';

  const [branchId, setBranchId] = useState('');
  const [assetId, setAssetId] = useState(prefilledAssetId);
  const [description, setDescription] = useState('');

  // Fetch prefilled asset details if we came from an asset detail page
  const { data: prefilledAsset, isLoading: isLoadingPrefilled } = useQuery({
    queryKey: ['asset', prefilledAssetId],
    queryFn: () => assetService.getOne(Number(prefilledAssetId)),
    enabled: !!prefilledAssetId,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => branchService.getAll({ per_page: 100 }),
    enabled: !prefilledAssetId, // only fetch if we don't have a prefilled asset
  });

  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets-dropdown', branchId],
    queryFn: () => assetService.getAll({ per_page: 100, branch_id: branchId }),
    enabled: !!branchId && !prefilledAssetId,
  });

  const mutation = useMutation({
    mutationFn: () => maintenanceService.create({ 
      asset_id: Number(assetId), 
      description, 
      status: 'scheduled'
    }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['maintenances'] }); 
      navigate('/maintenance', { replace: true }); 
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || error.message || 'Gagal membuat maintenance'}`);
    }
  });

  const isAssetInMaintenance = prefilledAsset?.status === 'maintenance';
  const canSubmit = (prefilledAssetId ? (assetId && description.trim() && !isAssetInMaintenance) : (branchId && assetId && description.trim())) && !mutation.isPending;

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Tambah Maintenance</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {prefilledAssetId ? (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label style={labelStyle}>Asset Terpilih</label>
            {isLoadingPrefilled ? (
              <div style={{ padding: '12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Loader2 size={16} className="spin" color={W.gray500} />
                <span style={{ fontSize: 13, color: W.gray500 }}>Memuat data asset...</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f8fafc', border: `1px solid ${W.gray200b}`, borderRadius: 8 }}>
                  <div style={{ width: 40, height: 40, background: '#e0f2fe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={20} color="#0284c7" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: W.gray900, marginBottom: 2 }}>{prefilledAsset?.name}</p>
                    <p style={{ fontSize: 12, color: W.gray500 }}>{prefilledAsset?.asset_tag} &bull; {prefilledAsset?.branch?.name}</p>
                  </div>
                </div>
                {isAssetInMaintenance && (
                  <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 2 }}>Sedang Maintenance</p>
                      <p style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.4 }}>Asset ini sudah dalam proses maintenance. Anda tidak dapat membuat permintaan baru.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Pilih Branch *</label>
              <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setAssetId(''); }} required style={inputStyle}>
                <option value="">-- Pilih Branch --</option>
                {branchesData?.data?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: W.gray500, marginTop: 4 }}>Pilih branch terlebih dahulu untuk melihat daftar asset</p>
            </div>

            <div>
              <label style={labelStyle}>Pilih Asset *</label>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required disabled={!branchId || isLoadingAssets} style={{ ...inputStyle, opacity: (!branchId || isLoadingAssets) ? 0.6 : 1 }}>
                <option value="">{isLoadingAssets ? 'Loading...' : (!branchId ? 'Pilih branch terlebih dahulu' : '-- Pilih Asset --')}</option>
                {assetsData?.data?.filter((a: any) => a.status !== 'maintenance').map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.asset_tag || a.asset_code})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <label style={labelStyle}>Deskripsi Kerusakan *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required placeholder="Jelaskan kerusakan yang terjadi pada asset..." style={{ ...inputStyle, resize: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, color: W.gray700, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Batal
          </button>
          <button type="submit" disabled={!canSubmit} className="press"
            style={{ ...primaryBtn, flex: 1, opacity: canSubmit ? 1 : 0.5, margin: 0 }}>
            {mutation.isPending ? <><Loader2 size={15} className="spin" /> Menyimpan...</> : 'Buat Maintenance'}
          </button>
        </div>
      </form>
    </div>
  );
};
