import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Wrench, Calendar, DollarSign, FileText, Hash, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { maintenanceService } from '@/services';
import { format } from 'date-fns';
import { W, stickyHeader, sectionLabel } from '@/lib/design';

const STATUS_INLINE: Record<string, { background: string; color: string }> = {
  pending:   { background: '#fefce8', color: '#a16207' },
  approved:  { background: '#dbeafe', color: '#1d4ed8' },
  completed: { background: '#f0fdf4', color: '#15803d' },
  rejected:  { background: '#fef2f2', color: '#b91c1c' },
};

export const MaintenanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: maint, isLoading, isError } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => maintenanceService.getOne(Number(id)),
    enabled: !!id,
    retry: 1,
  });

  const approveMutation = useMutation({
    mutationFn: () => maintenanceService.approve(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance', id] }); queryClient.invalidateQueries({ queryKey: ['maintenances'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => maintenanceService.reject(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance', id] }); queryClient.invalidateQueries({ queryKey: ['maintenances'] }); },
  });
  const completeMutation = useMutation({
    mutationFn: () => maintenanceService.complete(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenance', id] }); queryClient.invalidateQueries({ queryKey: ['maintenances'] }); },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100%', background: W.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    );
  }

  if (isError || !maint || (!maint.maintenance_type && !maint.title && !maint.id)) {
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
  const canApprove = maint.status === 'pending';
  const canComplete = maint.status === 'approved';
  const isPending = approveMutation.isPending || rejectMutation.isPending || completeMutation.isPending;

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Maintenance Detail</h1>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, flexShrink: 0, textTransform: 'capitalize', ...st }}>{maint.status}</span>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title + Asset card */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: W.gray900, margin: '0 0 12px 0' }}>{maint.maintenance_type || maint.title || 'Maintenance'}</h2>
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
            { icon: Clock,       label: 'Submitted',      val: maint.created_at ? format(new Date(maint.created_at), 'dd MMM yyyy, HH:mm') : null },
            { icon: Calendar,    label: 'Scheduled',      val: maint.maintenance_date || maint.scheduled_date ? format(new Date(maint.maintenance_date || maint.scheduled_date), 'dd MMM yyyy') : null },
            { icon: DollarSign,  label: 'Cost',           val: maint.cost ? `Rp ${Number(maint.cost).toLocaleString('id-ID')}` : null },
            { icon: Hash,        label: 'Asset Tag',      val: maint.asset?.asset_tag },
          ].filter(i => i.val).map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: W.gray500, width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: W.gray700, flex: 1 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {maint.description && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <FileText size={14} color={W.gray400} />
              <p style={{ ...sectionLabel, marginBottom: 0 }}>Description</p>
            </div>
            <p style={{ fontSize: 14, color: W.gray700, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{maint.description}</p>
          </div>
        )}

        {/* Actions */}
        {canApprove && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => rejectMutation.mutate()} disabled={isPending} className="press"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {rejectMutation.isPending ? <Loader2 size={15} className="spin" /> : <XCircle size={15} />}
              Reject
            </button>
            <button onClick={() => approveMutation.mutate()} disabled={isPending} className="press"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#16a34a', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
              {approveMutation.isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle size={15} />}
              Approve
            </button>
          </div>
        )}

        {canComplete && (
          <button onClick={() => completeMutation.mutate()} disabled={isPending} className="press"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#2563eb', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            {completeMutation.isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle size={15} />}
            Selesaikan Pekerjaan
          </button>
        )}
      </div>
    </div>
  );
};
