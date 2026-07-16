import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, Search, X, ScanLine, CheckCircle, Wrench, XCircle, Hash, MapPin } from 'lucide-react';
import { assetService } from '@/services';
import type { Asset } from '@/types';
import { W, stickyHeader } from '@/lib/design';

const getStatusIcon = (s: string) => {
  if (s === 'active') return <CheckCircle size={18} color="#16a34a" />;
  if (s === 'maintenance') return <Wrench size={18} color="#b45309" />;
  if (s === 'disposed' || s === 'disposal') return <XCircle size={18} color="#b91c1c" />;
  return <Package size={18} color="#6b7280" />;
};
const getStatusBg = (s: string) => ({
  active: '#f0fdf4', maintenance: '#fffbeb', disposed: '#fef2f2', disposal: '#fef2f2', stock: '#eff6ff',
}[s] || W.gray100);
const STATUS_BADGE: Record<string, { background: string; color: string }> = {
  active:      { background: '#f0fdf4', color: '#15803d' },
  maintenance: { background: '#fffbeb', color: '#b45309' },
  disposed:    { background: '#fef2f2', color: '#b91c1c' },
  disposal:    { background: '#fef2f2', color: '#b91c1c' },
  stock:       { background: '#eff6ff', color: '#1d4ed8' },
  inactive:    { background: W.gray100, color: W.gray700 },
};

export const AssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['assets', debouncedSearch, page],
    queryFn: () => assetService.getAll({ search: debouncedSearch, page, per_page: 20 }),
  });

  const assets: Asset[] = data?.data || [];
  const meta = data?.meta;

  return (
    <div style={{ minHeight: '100%', background: W.gray50, paddingBottom: 80 }} className="page-enter">
      {/* Header */}
      <div style={{ ...stickyHeader }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)' }}>
              <Package size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900, lineHeight: 1 }}>Assets</h1>
              <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>{meta?.total ?? 0} total items</p>
            </div>
          </div>
          <button onClick={() => navigate('/assets/scan')} className="press"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, fontWeight: 500, color: W.gray700, cursor: 'pointer' }}>
            <ScanLine size={15} color={W.gray600} /> Scan
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} color={W.gray400} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name, tag, serial..."
            style={{ width: '100%', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 10, padding: '9px 32px 9px 30px', fontSize: 13, color: W.gray900, outline: 'none' }} />
          {search && <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={W.gray400} /></button>}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
              <p style={{ color: W.gray500, fontSize: 13, marginTop: 12 }}>Loading...</p>
            </div>
          ) : assets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: W.orange100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Package size={24} color={W.orange500} />
              </div>
              <p style={{ fontWeight: 600, color: W.gray700 }}>No assets found</p>
            </div>
          ) : (
            <div>
              {assets.map((asset, i) => {
                const sb = STATUS_BADGE[asset.status] || { background: W.gray100, color: W.gray700 };
                const iconBg = getStatusBg(asset.status);
                return (
                  <div key={asset.id} onClick={() => navigate(`/assets/${asset.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = W.gray50)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getStatusIcon(asset.status)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: W.orange600 }}>{asset.asset_tag}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 20, ...sb }}>{asset.status}</span>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                        {((asset as any).type || (asset as any).asset_type?.name) && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray500 }}><Hash size={10} />{(asset as any).type || (asset as any).asset_type?.name}</span>}
                        {(asset.branch?.name || (asset.branch as any)?.nama_branch) && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray500 }}><MapPin size={10} />{asset.branch?.name || (asset.branch as any)?.nama_branch}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

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
    </div>
  );
};
