import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Plus, Clock, Search, X, Filter } from 'lucide-react';
import { maintenanceService } from '@/services';
import { format } from 'date-fns';
import type { AssetMaintenance } from '@/types';
import { W, stickyHeader } from '@/lib/design';

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
  pending:   { background: '#fefce8', color: '#a16207' },
  approved:  { background: '#eff6ff', color: '#1d4ed8' },
  rejected:  { background: '#fef2f2', color: '#b91c1c' },
  completed: { background: '#f0fdf4', color: '#15803d' },
};

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenances', search, status, page],
    queryFn: () => maintenanceService.getAll({ search, status, page, per_page: 15 }),
  });

  const items: AssetMaintenance[] = data?.data || [];
  const meta = data?.meta;

  return (
    <>
      <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
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

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {['', 'pending', 'approved', 'rejected', 'completed'].map((s) => {
            const active = status === s;
            return (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? W.orange500 : W.gray200b}`, background: active ? W.orange500 : '#fff', color: active ? '#fff' : W.gray600, transition: 'all 0.12s' }}>
                {s === '' ? 'All' : s}
              </button>
            );
          })}
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
                return (
                  <div key={item.id} onClick={() => navigate(`/maintenance/${item.id}`)}
                    style={{ padding: '13px 16px', cursor: 'pointer', borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = W.gray50)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: W.gray900, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{item.title}</p>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, flexShrink: 0, ...bb }}>{item.status}</span>
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

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === 1 ? W.gray400 : W.gray700, cursor: page === 1 ? 'default' : 'pointer' }}>← Prev</button>
            <span style={{ fontSize: 12, color: W.gray500 }}>Page {page} of {meta.last_page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page} style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === meta.last_page ? W.gray400 : W.gray700, cursor: page === meta.last_page ? 'default' : 'pointer' }}>Next →</button>
          </div>
        )}
      </div>
      </div>
      
      {/* FAB */}
      <button onClick={() => navigate('/maintenance/create')} className="press"
        style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)', right: 20, width: 56, height: 56, background: 'linear-gradient(135deg,#f97316,#ef4444)', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(249,115,22,0.4)', cursor: 'pointer', zIndex: 100 }}>
        <Plus size={24} color="#fff" />
      </button>
    </>
  );
};
