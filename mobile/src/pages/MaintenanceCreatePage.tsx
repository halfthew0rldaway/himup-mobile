import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { maintenanceService, assetService } from '@/services';
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState(prefilledAssetId);
  const [scheduledDate, setScheduledDate] = useState('');

  const { data: assetsData } = useQuery({
    queryKey: ['assets-dropdown'],
    queryFn: () => assetService.getAll({ per_page: 100 }),
  });

  const mutation = useMutation({
    mutationFn: () => maintenanceService.create({ 
      maintenance_type: title, 
      description, 
      asset_id: Number(assetId), 
      maintenance_date: scheduledDate || undefined,
      status: 'scheduled'
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); navigate('/maintenance'); },
  });

  const canSubmit = title.trim() && assetId && !mutation.isPending;

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>New Maintenance Request</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
        style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Asset *</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required style={inputStyle}>
              <option value="">Select asset...</option>
              {assetsData?.data?.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.asset_tag || a.asset_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Brief description of the issue..." style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detailed description (optional)..." style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div>
            <label style={labelStyle}>Scheduled Date</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {mutation.isError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 13, color: '#b91c1c' }}>Failed to submit. Please try again.</p>
          </div>
        )}

        <button type="submit" disabled={!canSubmit} className="press"
          style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.5 }}>
          {mutation.isPending ? <><Loader2 size={15} className="spin" /> Submitting...</> : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};
