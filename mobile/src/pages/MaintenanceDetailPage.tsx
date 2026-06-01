import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Wrench, Calendar, DollarSign, FileText, Hash, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { maintenanceService } from '@/services';
import { format } from 'date-fns';
import { W, stickyHeader, sectionLabel } from '@/lib/design';

const STATUS_INLINE: Record<string, { background: string; color: string }> = {
  scheduled:   { background: '#eff6ff', color: '#2563eb' }, // blue
  in_progress: { background: '#fefce8', color: '#d97706' }, // yellow
  completed:   { background: '#f0fdf4', color: '#16a34a' }, // green
};

export const MaintenanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const { data: maint, isLoading, isError } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => maintenanceService.getOne(Number(id)),
    enabled: !!id,
    retry: 1,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => maintenanceService.updateStatus(Number(id), status),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] }); 
      queryClient.invalidateQueries({ queryKey: ['maintenances'] }); 
      queryClient.invalidateQueries({ queryKey: ['maintenances-stats'] }); 
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Gagal mengubah status';
      alert(`Error: ${msg}`);
    }
  });

  const completeMutation = useMutation({
    mutationFn: () => maintenanceService.complete(Number(id), cost ? Number(cost) : 0, notes),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['maintenance', id] }); 
      queryClient.invalidateQueries({ queryKey: ['maintenances'] }); 
      queryClient.invalidateQueries({ queryKey: ['maintenances-stats'] }); 
      setCompleteModalOpen(false);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Gagal menyelesaikan pekerjaan';
      alert(`Error: ${msg}`);
    }
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100%', background: W.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    );
  }

  if (isError || !maint || (!maint.maintenance_type && !maint.description && !maint.id)) {
    return (
      <div style={{ minHeight: '100%', background: W.gray50 }}>
        <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={17} color={W.gray600} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Maintenance Detail</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12 }}>
          <Wrench size={40} color="#d1d5db" />
          <p style={{ fontSize: 14, color: W.gray500, textAlign: 'center' }}>Failed to load this record. Please go back and try again.</p>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', background: W.orange500, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
        </div>
      </div>
    );
  }

  const st = STATUS_INLINE[maint.status] || { background: W.gray100, color: W.gray700 };
  const canStart = maint.status === 'scheduled';
  const canComplete = maint.status === 'in_progress';
  const isPending = updateStatusMutation.isPending || completeMutation.isPending;

  return (
    <>
    <div style={{ minHeight: '100%', background: W.gray50, paddingBottom: 80 }} className="page-enter">
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Maintenance Detail</h1>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, flexShrink: 0, textTransform: 'capitalize', ...st }}>
          {maint.status.replace('_', ' ')}
        </span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title + Asset card */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 16 }}>
          {maint.asset && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wrench size={14} color={W.orange500} />
              <span style={{ fontSize: 13, fontWeight: 600, color: W.orange600 }}>{maint.asset.name}</span>
              {maint.asset.asset_tag && (
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: W.gray500 }}>({maint.asset.asset_tag})</span>
              )}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 14 }}>
          <p style={sectionLabel}>Details</p>
          {[
            { icon: Clock,       label: 'Dibuat Pada',      val: maint.created_at ? format(new Date(maint.created_at), 'dd MMM yyyy, HH:mm') : null },
            { icon: DollarSign,  label: 'Biaya',           val: maint.cost ? `Rp ${Number(maint.cost).toLocaleString('id-ID')}` : null },
          ].filter(i => i.val).map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: W.gray500, width: 90, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: W.gray700, flex: 1 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {maint.description && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileText size={14} color={W.gray400} />
              <p style={{ ...sectionLabel, marginBottom: 0 }}>Deskripsi Kerusakan</p>
            </div>
            <p style={{ fontSize: 14, color: W.gray700, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{maint.description}</p>
          </div>
        )}

        {/* Resolution Notes (if completed) */}
        {maint.notes && (
          <div style={{ background: '#f0fdf4', borderRadius: 12, border: `1px solid #bbf7d0`, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle size={14} color="#16a34a" />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 0 }}>Catatan Perbaikan</p>
            </div>
            <p style={{ fontSize: 14, color: '#15803d', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{maint.notes}</p>
          </div>
        )}

        {/* Actions */}
        {canStart && (
          <button onClick={() => updateStatusMutation.mutate('in_progress')} disabled={isPending} className="press"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            {updateStatusMutation.isPending ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
            Mulai Pengerjaan
          </button>
        )}

        {canComplete && (
          <button onClick={() => setCompleteModalOpen(true)} disabled={isPending} className="press"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            {isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle size={15} />}
            Selesaikan Maintenance
          </button>
        )}
      </div>
    </div>

    {/* Selesaikan Maintenance Modal */}
    {completeModalOpen && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
        <div className="page-enter" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${W.gray100b}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Selesaikan Maintenance</h3>
            <button onClick={() => setCompleteModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: W.gray400, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>Menyelesaikan maintenance untuk <span style={{ fontWeight: 700 }}>{maint?.asset?.name}</span></p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: W.gray700, marginBottom: 8 }}>
                <DollarSign size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4, color: '#10b981' }}/>
                Biaya Perbaikan
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', background: W.gray100, borderRight: `1px solid ${W.gray200b}`, color: W.gray600, fontSize: 14, fontWeight: 500 }}>Rp</span>
                <input 
                  type="number" 
                  value={cost} 
                  onChange={(e) => setCost(e.target.value)} 
                  placeholder="0"
                  style={{ flex: 1, padding: '10px 12px', fontSize: 14, color: W.gray900, outline: 'none', border: 'none', background: 'transparent' }} 
                />
              </div>
              <p style={{ fontSize: 11, color: W.gray500, marginTop: 4 }}>Kosongkan jika tidak ada biaya</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: W.gray700, marginBottom: 8 }}>
                <FileText size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4, color: '#10b981' }}/>
                Catatan Perbaikan *
              </label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={4} 
                required
                placeholder="Jelaskan apa yang diperbaiki..."
                style={{ width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: W.gray900, outline: 'none', resize: 'none' }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setCompleteModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, color: W.gray700, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => completeMutation.mutate()} disabled={!notes.trim() || completeMutation.isPending}
                style={{ flex: 1, padding: '10px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: !notes.trim() || completeMutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {completeMutation.isPending ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} Selesaikan
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
