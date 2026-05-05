import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { ticketService, assetService, branchService, categoryService } from '@/services';
import { W, stickyHeader, primaryBtn } from '@/lib/design';

const inputStyle: React.CSSProperties = {
  width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`,
  borderRadius: 8, padding: '10px 12px', fontSize: 14, color: W.gray900, outline: 'none',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: W.gray700, marginBottom: 6 };

export const TicketCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const prefilledAssetId = searchParams.get('asset_id') || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState(prefilledAssetId);
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('medium');

  const { data: assetsData } = useQuery({
    queryKey: ['assets-dropdown'],
    queryFn: () => assetService.getAll({ per_page: 100 }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => branchService.getAll({ per_page: 200 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-dropdown'],
    queryFn: () => categoryService.getAll(),
  });

  // Auto-select branch if asset is chosen
  useEffect(() => {
    if (assetId && assetsData?.data) {
      const asset = assetsData.data.find((a: any) => a.id === Number(assetId));
      if (asset?.branch_id || asset?.branch?.id) {
        setBranchId(String(asset.branch_id || asset.branch.id));
      }
    }
  }, [assetId, assetsData]);

  const mutation = useMutation({
    mutationFn: () => ticketService.create({ 
      title, 
      description, 
      asset_id: assetId ? Number(assetId) : undefined, 
      branch_id: branchId ? Number(branchId) : undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      priority,
      status: 'open'
    }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['tickets'] }); 
      navigate('/tickets'); 
    },
  });

  const canSubmit = title.trim() && branchId && !mutation.isPending;

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Report New Problem</h1>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: 12, display: 'flex', gap: 10, marginBottom: 16 }}>
          <AlertCircle size={18} color="#b45309" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
            <strong>On-Site Reporting:</strong> Filling out this form will create a new ticket in the system.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Subject / Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What's the issue?" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Branch *</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} required style={inputStyle}>
                <option value="">Select branch...</option>
                {branchesData?.data?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.nama_branch || b.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
                  <option value="">Select category...</option>
                  {categoriesData?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority *</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Related Asset (Optional)</label>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)} style={inputStyle}>
                <option value="">No specific asset</option>
                {assetsData?.data?.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.asset_tag})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Detailed Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe the findings..." style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>

          <button type="submit" disabled={!canSubmit} className="press"
            style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.5, marginTop: 10 }}>
            {mutation.isPending ? <><Loader2 size={15} className="spin" /> Submitting...</> : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
