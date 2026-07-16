import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Plus, Clock, Search, X, Filter } from 'lucide-react';
import { maintenanceService } from '@/services';
import { format } from 'date-fns';
import type { AssetMaintenance } from '@/types';
import { W, stickyHeader } from '@/lib/design';
import { PullToRefresh } from '@/components/PullToRefresh';

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
  scheduled:   { background: '#eff6ff', color: '#2563eb' },
  pending:     { background: '#eff6ff', color: '#2563eb' },
  in_progress: { background: '#fefce8', color: '#d97706' },
  approved:    { background: '#fefce8', color: '#d97706' },
  completed:   { background: '#f0fdf4', color: '#16a34a' },
};

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch: refetchList } = useQuery({
    queryKey: ['maintenances', search, status, page],
    queryFn: () => maintenanceService.getAll({ search, status, page, per_page: 15 }),
  });

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['maintenances-stats', search],
    queryFn: () => maintenanceService.getAll({ search, per_page: 500 }),
  });

  const handleRefresh = async () => {
    await Promise.all([refetchList(), refetchStats()]);
  };

  const items: AssetMaintenance[] = data?.data || [];
  const meta = data?.meta;

  const stats = {
    total: statsData?.meta?.total || 0,
    scheduled: statsData?.data?.filter((i: any) => i.status === 'scheduled' || i.status === 'pending').length || 0,
    in_progress: statsData?.data?.filter((i: any) => i.status === 'in_progress' || i.status === 'approved').length || 0,
    completed: statsData?.data?.filter((i: any) => i.status === 'completed').length || 0,
  };

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <div style={{ minHeight: '100%', background: W.gray50, paddingBottom: 80 }} className="page-enter">
        {/* Header */}
      <div style={{ ...stickyHeader }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)' }}>
              <Wrench size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900, lineHeight: 1 }}>Maintenance</h1>
              <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>{meta?.total ?? 0} requests</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={14} color={W.gray400} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search maintenance..."
            style={{ width: '100%', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 10, padding: '9px 32px 9px 30px', fontSize: 13, color: W.gray900, outline: 'none' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={W.gray400} /></button>}
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'Total', val: stats.total, active: !status, onClick: () => { setStatus(''); setPage(1); }, activeBg: '#111827', activeText: '#fff', inactiveBg: '#fff', inactiveText: W.gray900 },
            { label: 'Scheduled', val: stats.scheduled, active: status === 'scheduled', onClick: () => { setStatus(status === 'scheduled' ? '' : 'scheduled'); setPage(1); }, activeBg: '#2563eb', activeText: '#fff', inactiveBg: '#eff6ff', inactiveText: '#1d4ed8' },
            { label: 'In Prog.', val: stats.in_progress, active: status === 'in_progress', onClick: () => { setStatus(status === 'in_progress' ? '' : 'in_progress'); setPage(1); }, activeBg: '#d97706', activeText: '#fff', inactiveBg: '#fefce8', inactiveText: '#b45309' },
            { label: 'Completed', val: stats.completed, active: status === 'completed', onClick: () => { setStatus(status === 'completed' ? '' : 'completed'); setPage(1); }, activeBg: '#16a34a', activeText: '#fff', inactiveBg: '#f0fdf4', inactiveText: '#15803d' },
          ].map(({ label, val, active, onClick, activeBg, activeText, inactiveBg, inactiveText }) => (
            <button key={label} onClick={onClick} style={{ flex: '1 1 calc(25% - 5px)', minWidth: 70, padding: '8px 4px', borderRadius: 10, border: '1px solid', borderColor: active ? activeBg : W.gray100b, background: active ? activeBg : inactiveBg, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
              <p style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : inactiveText, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: active ? activeText : inactiveText }}>{val}</p>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
            </div>
          ) : items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Wrench size={24} color="#b45309" />
              </div>
              <p style={{ fontWeight: 600, color: W.gray700 }}>No maintenance requests</p>
            </div>
          ) : (
            <div>
              {items.map((item, i) => {
                const bb = STATUS_BADGE[item.status] || { background: W.gray100, color: W.gray600 };
                const isCompleted = item.status === 'completed';
                return (
                  <div key={item.id} onClick={() => { if (!isCompleted) navigate(`/maintenance/${item.id}`); }}
                    style={{ padding: '13px 16px', cursor: isCompleted ? 'default' : 'pointer', borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none', transition: 'background 0.1s', opacity: isCompleted ? 0.7 : 1 }}
                    onMouseEnter={(e) => { if (!isCompleted) e.currentTarget.style.background = W.gray50; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: W.gray900, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{item.maintenance_type || item.title || 'Maintenance'}</p>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, flexShrink: 0, textTransform: 'capitalize', ...bb }}>{item.status.replace('_', ' ')}</span>
                    </div>
                    {item.asset?.name && <p style={{ fontSize: 12, color: W.orange600, marginBottom: 4 }}>{item.asset.name}</p>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray400 }}>
                      <Clock size={11} />{format(new Date(item.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
      </div>
      
    </PullToRefresh>
    {/* Fixed Pagination */}
    {meta && meta.last_page > 1 && (
      <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 57px)', left: 0, right: 0, padding: '12px 16px', background: W.gray50, borderTop: `1px solid ${W.gray200b}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 90, boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
          style={{ minHeight: 44, padding: '10px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === 1 ? W.gray400 : W.gray700, cursor: page === 1 ? 'default' : 'pointer' }}>← Prev</button>
        <span style={{ fontSize: 12, color: W.gray500 }}>Page {page} of {meta.last_page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}
          style={{ minHeight: 44, padding: '10px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === meta.last_page ? W.gray400 : W.gray700, cursor: page === meta.last_page ? 'default' : 'pointer' }}>Next →</button>
      </div>
    )}

    {/* FAB */}
    <button onClick={() => navigate('/maintenance/create')} className="press"
      style={{ position: 'fixed', bottom: meta && meta.last_page > 1 ? 'calc(env(safe-area-inset-bottom, 0px) + 142px)' : 'calc(env(safe-area-inset-bottom, 0px) + 80px)', right: 20, width: 56, height: 56, background: 'linear-gradient(135deg,#f97316,#ef4444)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(249,115,22,0.4)', cursor: 'pointer', zIndex: 100, transition: 'bottom 0.2s' }}>
      <Plus size={24} color="#fff" />
    </button>
    </>
  );
};
