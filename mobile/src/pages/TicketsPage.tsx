import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, X, Filter, Clock, Tag, User, Building, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { ticketService } from '@/services';
import { formatDistanceToNow } from 'date-fns';
import type { Ticket as TicketType } from '@/types';
import { W, stickyHeader } from '@/lib/design';

const priorityBar = (p: string) => ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[p] || '#9ca3af');
const priorityBadge = (p: string) => ({
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700',
}[p] || 'bg-gray-100 text-gray-700');
const statusBadge = (s: string) => ({
  open: 'bg-orange-100 text-orange-700', in_progress: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600', on_hold: 'bg-yellow-100 text-yellow-700',
}[s] || 'bg-gray-100 text-gray-700');

// badge style from Tailwind class name (inline style equivalent)
const PRIORITY_INLINE: Record<string, { background: string; color: string }> = {
  critical: { background: '#fef2f2', color: '#b91c1c' },
  high:     { background: '#fff7ed', color: '#c2410c' },
  medium:   { background: '#fefce8', color: '#a16207' },
  low:      { background: '#f0fdf4', color: '#15803d' },
};
const STATUS_INLINE: Record<string, { background: string; color: string }> = {
  open:        { background: '#fff7ed', color: '#c2410c' },
  in_progress: { background: '#eff6ff', color: '#1d4ed8' },
  closed:      { background: '#f3f4f6', color: '#374151' },
  on_hold:     { background: '#fefce8', color: '#a16207' },
};

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', tab, search, status, priority, page],
    queryFn: () => tab === 'my'
      ? ticketService.getMy({ search, status, priority, page, per_page: 10 })
      : ticketService.getAll({ search, status, priority, page, per_page: 10 }),
    refetchInterval: 30000,
  });

  const tickets: TicketType[] = data?.data || [];
  const meta = data?.meta;
  const stats = {
    total: meta?.total || 0,
    open: (data as any)?.open_count ?? 0,
    in_progress: (data as any)?.in_progress_count ?? 0,
    closed: (data as any)?.closed_count ?? 0,
  };
  const hasFilters = !!(search || status || priority);

  const formatAgo = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });

  return (
    <>
      <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
        {/* Header */}
      <div style={{ ...stickyHeader }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)' }}>
              <Ticket size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900, lineHeight: 1 }}>Tickets</h1>
              <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>{tab === 'my' ? 'My Tickets' : 'All Tickets'}</p>
            </div>
          </div>
        </div>

        {/* Tabs — matches web exactly */}
        <div style={{ display: 'flex', background: W.gray100, borderRadius: 10, padding: 4, gap: 4, marginBottom: 12 }}>
          {(['all', 'my'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              style={{
                flex: 1, padding: '8px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', borderRadius: 8, transition: 'all 0.15s',
                background: tab === t ? '#ffffff' : 'transparent',
                color: tab === t ? W.orange600 : W.gray600,
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'all' ? 'All Tickets' : 'My Tickets'}
            </button>
          ))}
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {[
            { label: 'Total', val: stats.total, active: !status, onClick: () => { setStatus(''); setPage(1); }, activeBg: '#111827', activeText: '#fff', inactiveBg: '#fff', inactiveText: W.gray900 },
            { label: 'Open', val: stats.open, active: status === 'open', onClick: () => { setStatus(status === 'open' ? '' : 'open'); setPage(1); }, activeBg: W.orange500, activeText: '#fff', inactiveBg: '#fff7ed', inactiveText: W.orange700 },
            { label: 'In Prog.', val: stats.in_progress, active: status === 'in_progress', onClick: () => { setStatus(status === 'in_progress' ? '' : 'in_progress'); setPage(1); }, activeBg: '#2563eb', activeText: '#fff', inactiveBg: '#eff6ff', inactiveText: '#1d4ed8' },
            { label: 'Closed', val: stats.closed, active: status === 'closed', onClick: () => { setStatus(status === 'closed' ? '' : 'closed'); setPage(1); }, activeBg: '#4b5563', activeText: '#fff', inactiveBg: W.gray50, inactiveText: W.gray700 },
          ].map(({ label, val, active, onClick, activeBg, activeText, inactiveBg, inactiveText }) => (
            <button key={label} onClick={onClick} style={{ flex: '1 1 calc(25% - 5px)', minWidth: 70, padding: '8px 4px', borderRadius: 10, border: '1px solid', borderColor: active ? activeBg : W.gray100b, background: active ? activeBg : inactiveBg, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
              <p style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : inactiveText, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: active ? activeText : inactiveText }}>{val}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <Search size={14} color={W.gray400} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
            style={{ width: '100%', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 10, padding: '9px 32px 9px 30px', fontSize: 13, color: W.gray900, outline: 'none' }} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color={W.gray400} /></button>}
        </div>

        {/* Filter toggle */}
        <button onClick={() => setFilterOpen(!filterOpen)} className="press"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: hasFilters ? W.orange500 : '#fff', border: `1px solid ${hasFilters ? W.orange500 : W.gray200b}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: hasFilters ? '#fff' : W.gray700, cursor: 'pointer' }}>
          <Filter size={14} />
          Filter
          {filterOpen ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
        </button>

        {filterOpen && (
          <div style={{ background: '#fff', border: `1px solid ${W.gray100b}`, borderRadius: 10, padding: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: W.gray600, display: 'block', marginBottom: 4 }}>Status</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, background: '#fff', color: W.gray900, outline: 'none' }}>
                  <option value="">All</option>
                  <option value="open">🟠 Open</option>
                  <option value="in_progress">🔵 In Progress</option>
                  <option value="closed">⚫ Closed</option>
                  <option value="on_hold">🟡 On Hold</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: W.gray600, display: 'block', marginBottom: 4 }}>Priority</label>
                <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
                  style={{ width: '100%', padding: '8px', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, background: '#fff', color: W.gray900, outline: 'none' }}>
                  <option value="">All</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setPage(1); setFilterOpen(false); }}
                style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px' }}>
        {/* White card container */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
              <p style={{ color: W.gray500, fontSize: 13, marginTop: 12 }}>Loading...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: W.orange100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ticket size={24} color={W.orange500} />
              </div>
              <p style={{ fontWeight: 600, color: W.gray700 }}>No tickets found</p>
              <p style={{ fontSize: 12, color: W.gray400, marginTop: 4 }}>{hasFilters ? 'Try adjusting your filters' : 'No tickets assigned to you'}</p>
            </div>
          ) : (
            <div>
              {tickets.map((ticket, i) => {
                const pb = priorityBar(ticket.priority);
                const st = STATUS_INLINE[ticket.status] || { background: W.gray100, color: W.gray700 };
                const pr = PRIORITY_INLINE[ticket.priority] || { background: W.gray100, color: W.gray700 };
                return (
                  <div key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}
                    style={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer', borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fff7ed')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Priority bar */}
                    <div style={{ width: 4, flexShrink: 0, background: pb }} />
                    <div style={{ flex: 1, padding: '14px 14px 12px', minWidth: 0 }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: W.orange600, background: W.orange50, padding: '2px 7px', borderRadius: 6 }}>{ticket.ticket_number}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, ...st }}>{ticket.status.replace('_', ' ')}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, ...pr }}>{ticket.priority}</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray400, flexShrink: 0 }}>
                          <Clock size={11} />{formatAgo(ticket.created_at)}
                        </span>
                      </div>
                      {/* Title */}
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: W.gray900, lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ticket.title}
                      </h3>
                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {ticket.category?.name && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray500 }}><Tag size={11} color={W.gray400} />{ticket.category.name}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: W.gray500 }}><User size={11} color={W.gray400} />{ticket.requester?.name || 'Unknown'}</span>
                        {ticket.branch?.name && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16a34a' }}><Building size={11} />{ticket.branch.name}</span>}
                        {(ticket.comments?.length ?? 0) > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#2563eb' }}><MessageSquare size={11} />{ticket.comments!.length}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === 1 ? W.gray400 : W.gray700, cursor: page === 1 ? 'default' : 'pointer' }}>← Prev</button>
            <span style={{ fontSize: 12, color: W.gray500 }}>Page {page} of {meta.last_page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.last_page}
              style={{ padding: '8px 16px', background: '#fff', border: `1px solid ${W.gray200b}`, borderRadius: 8, fontSize: 13, color: page === meta.last_page ? W.gray400 : W.gray700, cursor: page === meta.last_page ? 'default' : 'pointer' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
