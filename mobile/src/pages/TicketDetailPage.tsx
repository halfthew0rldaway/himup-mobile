import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Tag, Building, Clock, MessageSquare, Send, Paperclip, CheckCircle, Loader2, Timer, UserCheck, FileText, Image, Play } from 'lucide-react';
import { ticketService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { format, formatDistanceStrict } from 'date-fns';
import type { Ticket } from '@/types';
import { W, stickyHeader, sectionLabel } from '@/lib/design';
import Lottie from 'lottie-react';
import successAnimation from '@/assets/lottie/success.json';

const SafeLottie = (Lottie as any).default || Lottie;

const STORAGE_URL = 'https://api.himup.id/storage/';

const STATUS_INLINE: Record<string, { background: string; color: string }> = {
  open:        { background: '#fff7ed', color: '#c2410c' },
  in_progress: { background: '#dbeafe', color: '#1d4ed8' },
  resolved:    { background: '#f0fdf4', color: '#15803d' },
  closed:      { background: '#f3f4f6', color: '#374151' },
  hold:        { background: '#fefce8', color: '#a16207' },
};
const PRIORITY_INLINE: Record<string, { background: string; color: string }> = {
  critical: { background: '#fef2f2', color: '#b91c1c' },
  high:     { background: '#fff7ed', color: '#c2410c' },
  medium:   { background: '#fefce8', color: '#a16207' },
  low:      { background: '#f0fdf4', color: '#15803d' },
};
const NEXT: Record<string, { label: string; next: string; bg: string; shadow: string }> = {
  open:        { label: 'Start Working', next: 'in_progress', bg: '#2563eb', shadow: 'rgba(37,99,235,0.3)' },
  in_progress: { label: 'Selesaikan Tiket', next: 'resolved', bg: '#16a34a', shadow: 'rgba(22,163,74,0.3)' },
};

// SLA limits per priority
const SLA_MS: Record<string, number> = {
  critical: 4  * 3600000,
  high:     8  * 3600000,
  medium:   24 * 3600000,
  low:      72 * 3600000,
};

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function isImage(filepath: string) {
  return /\.(jpe?g|png|gif|webp|svg|heic|heif)$/i.test(filepath);
}

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [localStopped, setLocalStopped] = useState(false);

  // Hold / Resolution Modal States
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState('');

  // Lock body scroll when modals are open
  useEffect(() => {
    if (holdModalOpen || resolutionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [holdModalOpen, resolutionModalOpen]);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getOne(Number(id)),
    enabled: !!id,
    refetchInterval: 15000,
  });

  // Live SLA timer — counts from created_at while not yet closed/resolved, deducting hold duration
  useEffect(() => {
    if (!ticket || localStopped || ticket.status === 'closed' || ticket.status === 'resolved') return;
    
    const update = () => {
      let holdMs = 0;
      if (ticket.holds) {
        ticket.holds.forEach((h: any) => {
          if (h.started_at && h.ended_at) {
            holdMs += new Date(h.ended_at).getTime() - new Date(h.started_at).getTime();
          }
        });
      }
      if (ticket.status === 'hold') {
        const activeHold = ticket.active_hold || (ticket.holds && ticket.holds.find((h: any) => h.ended_at === null));
        if (activeHold && activeHold.started_at) {
          holdMs += Date.now() - new Date(activeHold.started_at).getTime();
        }
      }
      // NOTE: SLA calculation uses client Date.now(). For full security against client time spoofing, 
      // this requires the backend API to provide a 'server_time' in the response to calculate a reliable offset.
      const rawElapsed = Date.now() - new Date(ticket.created_at).getTime();
      setElapsed(Math.max(0, rawElapsed - holdMs));
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [ticket?.created_at, ticket?.status, ticket?.holds, ticket?.active_hold, localStopped]);

  const isActive = ticket?.status === 'in_progress';
  const slaLimit = ticket ? (SLA_MS[ticket.priority] ?? SLA_MS.medium) : 0;
  const slaPercent = slaLimit ? Math.min((elapsed / slaLimit) * 100, 100) : 0;
  const isFinished = ticket?.status === 'closed' || ticket?.status === 'resolved';
  const slaBreached = elapsed > slaLimit && !isFinished;



  const holdMutation = useMutation({
    mutationFn: (reason: string) => ticketService.hold(Number(id), reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-stats'] });
      setHoldModalOpen(false);
      setHoldReason('');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Gagal menunda tiket';
      alert(`Error: ${msg}`);
    }
  });

  const resumeMutation = useMutation({
    mutationFn: () => ticketService.resume(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-stats'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Gagal melanjutkan tiket';
      alert(`Error: ${msg}`);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, resolution }: { status: string; resolution?: string }) => {
      if (status === 'resolved') {
        return ticketService.close(Number(id), resolution);
      }
      return ticketService.updateStatus(Number(id), status);
    },
    onMutate: ({ status }) => {
      if (status === 'resolved' || status === 'closed') {
        setLocalStopped(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-stats'] });
      setResolutionModalOpen(false);
      setResolutionText('');
    },
    onError: (error: any) => {
      setLocalStopped(false);
      const msg = error.response?.data?.message || error.message || 'Gagal memperbarui status';
      alert(`Error: ${msg}`);
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      if (ticket?.status === 'open' && !ticket.pic) {
        try {
          await ticketService.takeOwnership(Number(id), user!.id);
          await ticketService.updateStatus(Number(id), 'in_progress');
        } catch (e) {
          console.warn('Auto-assign failed', e);
        }
      }
      return ticketService.addComment(Number(id), body);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['ticket', id] }); 
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-stats'] });
      setComment(''); 
    },
  });

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await ticketService.uploadAttachment(Number(id), file);
    queryClient.invalidateQueries({ queryKey: ['ticket', id] });
  };

  if (isLoading || !ticket) {
    return (
      <div style={{ minHeight: '100%', background: W.gray50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
      </div>
    );
  }

  const st = STATUS_INLINE[ticket.status] || { background: W.gray100, color: W.gray700 };
  const pr = PRIORITY_INLINE[ticket.priority] || { background: W.gray100, color: W.gray700 };
  const next = NEXT[ticket.status];
  const comments = Array.isArray(ticket.comments) ? ticket.comments : [];
  const attachments = Array.isArray(ticket.attachments) ? ticket.attachments : [];


  return (
    <>
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      {/* Header */}
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, background: W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={17} color={W.gray600} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: W.orange600, background: W.orange50, padding: '1px 6px', borderRadius: 4 }}>{ticket.ticket_number}</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{ticket.title}</div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Status + SLA card */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize', ...st }}>{ticket.status.replace('_', ' ')}</span>
            <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', ...pr }}>{ticket.priority}</span>
          </div>

          {/* SLA — shows while open or in_progress */}
          {!isFinished && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Timer size={13} color={slaBreached ? '#dc2626' : isActive ? '#2563eb' : '#9ca3af'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: slaBreached ? '#dc2626' : isActive ? '#2563eb' : '#9ca3af' }}>
                    {slaBreached ? 'SLA TERLAMPAUI' : isActive ? 'SLA Berjalan' : 'Menunggu'}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: slaBreached ? '#dc2626' : W.gray900 }}>
                  {formatMs(elapsed)}
                </span>
              </div>
              <div style={{ height: 6, background: W.gray100, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, transition: 'width 1s linear', width: `${slaPercent}%`, background: slaBreached ? '#dc2626' : slaPercent > 80 ? '#f97316' : '#2563eb' }} />
              </div>
              <p style={{ fontSize: 11, color: W.gray400, marginTop: 4 }}>
                Batas SLA: {formatDistanceStrict(0, slaLimit)}
              </p>
            </div>
          )}

          {/* Completed SLA summary */}
          {isFinished && (() => {
            const closedAt = (ticket as any).closed_at || ticket.updated_at;
            let completedHoldMs = 0;
            if (ticket.holds) {
              ticket.holds.forEach((h: any) => {
                if (h.started_at && h.ended_at) {
                  completedHoldMs += new Date(h.ended_at).getTime() - new Date(h.started_at).getTime();
                }
              });
            }
            const rawResolveMs = closedAt ? new Date(closedAt).getTime() - new Date(ticket.created_at).getTime() : 0;
            const resolveMs = Math.max(0, rawResolveMs - completedHoldMs);
            const resolvePercent = slaLimit ? Math.min((resolveMs / slaLimit) * 100, 100) : 0;
            const breached = resolveMs > slaLimit;
            return (
              <div style={{ marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={13} color={breached ? '#dc2626' : '#16a34a'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: breached ? '#dc2626' : '#16a34a' }}>
                      {breached ? 'SLA Terlampaui' : 'Selesai Dalam SLA'}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: breached ? '#dc2626' : '#15803d' }}>
                    {formatMs(resolveMs)}
                  </span>
                </div>
                <div style={{ height: 6, background: W.gray100, borderRadius: 99, overflow: 'hidden', position: 'relative', zIndex: 2 }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${resolvePercent}%`, background: breached ? '#dc2626' : resolvePercent > 80 ? '#f97316' : '#16a34a' }} />
                </div>
                <p style={{ fontSize: 11, color: W.gray400, marginTop: 4, position: 'relative', zIndex: 2 }}>
                  Batas SLA: {formatDistanceStrict(0, slaLimit)} · Diselesaikan: {closedAt ? format(new Date(closedAt), 'dd MMM yyyy · HH:mm') : '-'}
                </p>

              </div>
            );
          })()}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {ticket.status === 'open' && ticket.pic && (
              <button onClick={() => statusMutation.mutate({ status: 'in_progress' })} disabled={statusMutation.isPending} className="press"
                style={{ width: '100%', padding: '11px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37,99,235,0.3)', opacity: statusMutation.isPending ? 0.7 : 1 }}>
                {statusMutation.isPending ? <><Loader2 size={15} className="spin" /> Memperbarui…</> : <><CheckCircle size={15} />Mulai Bekerja</>}
              </button>
            )}

            {ticket.status === 'in_progress' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setResolutionModalOpen(true)} disabled={statusMutation.isPending} className="press"
                  style={{ flex: 2, padding: '11px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(22,163,74,0.3)', opacity: statusMutation.isPending ? 0.7 : 1 }}>
                  <CheckCircle size={15} />Selesaikan Tiket
                </button>
                {user?.role && ['super-admin', 'manager'].includes(user.role.slug) && (
                  <button onClick={() => setHoldModalOpen(true)} disabled={holdMutation.isPending} className="press"
                    style={{ flex: 1, padding: '11px', background: '#eab308', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(234,179,8,0.3)', opacity: holdMutation.isPending ? 0.7 : 1 }}>
                    <Clock size={15} />Tunda
                  </button>
                )}
              </div>
            )}

            {ticket.status === 'hold' && (
              <div>
                {user?.role && ['super-admin', 'manager'].includes(user.role.slug) ? (
                  <button onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending} className="press"
                    style={{ width: '100%', padding: '14px', background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37,99,235,0.3)', opacity: resumeMutation.isPending ? 0.7 : 1 }}>
                    {resumeMutation.isPending ? <><Loader2 size={15} className="spin" /> Melanjutkan…</> : <><Play size={15} /> Lanjutkan Tiket</>}
                  </button>
                ) : (
                  <div style={{ padding: '12px 14px', background: '#fefce8', border: '1px solid #fef3c7', borderRadius: 8, fontSize: 13, color: '#a16207', textAlign: 'center', fontWeight: 500 }}>
                    Tiket sedang ditangguhkan. Hanya Admin/Manager yang dapat melanjutkan.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info — matches web app detail panel */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${W.gray50}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} color={W.gray400} />
            <span style={{ fontSize: 13, fontWeight: 600, color: W.gray900 }}>Detail</span>
          </div>
          <div>
            {[
              { icon: <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />, label: 'Status', val: <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, ...st, textTransform: 'capitalize' as const }}>{ticket.status.replace('_', ' ')}</span> },
              { icon: <Tag size={14} color={W.gray400} />, label: 'Prioritas', val: <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, ...pr, textTransform: 'capitalize' as const }}>{ticket.priority}</span> },
              { icon: <Tag size={14} color={W.gray400} />, label: 'Kategori', val: <span style={{ fontSize: 12, color: W.gray700 }}>{ticket.category?.name || '-'}</span> },
              { icon: <User size={14} color={W.gray400} />, label: 'Pelapor', val: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {ticket.requester?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span style={{ fontSize: 12, color: W.gray700 }}>{ticket.requester?.name || '-'}</span>
                </div>
              )},
              { icon: <UserCheck size={14} color="#3b82f6" />, label: 'PIC', val: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ticket.pic ? (
                    <>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {ticket.pic.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: 12, color: W.gray700 }}>{ticket.pic.name}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: W.gray400, fontStyle: 'italic' }}>Belum ada</span>
                  )}
                </div>
              )},
              ...(ticket.branch ? [{ icon: <Building size={14} color={W.gray400} />, label: 'Cabang', val: <span style={{ fontSize: 12, color: W.gray700 }}>{ticket.branch.name}</span> }] : []),
              ...((ticket as any).asset ? [{ icon: <Tag size={14} color="#8b5cf6" />, label: 'Aset', val: (
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 12, color: W.gray700, fontWeight: 500 }}>{(ticket as any).asset.name}</div>
                  <div style={{ fontSize: 11, color: W.gray400, fontFamily: 'monospace' }}>{(ticket as any).asset.asset_tag}</div>
                </div>
              )}] : []),
              { icon: <Clock size={14} color={W.gray400} />, label: 'Dibuat', val: <span style={{ fontSize: 12, color: W.gray500 }}>{ticket.created_at ? format(new Date(ticket.created_at), 'dd MMM yyyy · HH:mm') : '-'}</span> },
              ...(isFinished ? [{ icon: <Clock size={14} color={W.gray400} />, label: 'Ditutup', val: <span style={{ fontSize: 12, color: W.gray500 }}>{(ticket as any).closed_at ? format(new Date((ticket as any).closed_at), 'dd MMM yyyy · HH:mm') : format(new Date(ticket.updated_at), 'dd MMM yyyy · HH:mm')}</span> }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${W.gray50}`, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {row.icon}
                  <span style={{ fontSize: 12, color: W.gray500 }}>{row.label}</span>
                </div>
                <div style={{ minWidth: 0 }}>{row.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Waktu Penanganan — shows for closed tickets, deducting hold time */}
        {isFinished && (() => {
          const closedAt = (ticket as any).closed_at || ticket.updated_at;
          let completedHoldMs = 0;
          if (ticket.holds) {
            ticket.holds.forEach((h: any) => {
              if (h.started_at && h.ended_at) {
                completedHoldMs += new Date(h.ended_at).getTime() - new Date(h.started_at).getTime();
              }
            });
          }
          const rawTotalMs = closedAt ? new Date(closedAt).getTime() - new Date(ticket.created_at).getTime() : 0;
          const totalMs = Math.max(0, rawTotalMs - completedHoldMs);
          const totalSec = Math.floor(totalMs / 1000);
          const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
          const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
          const ss = String(totalSec % 60).padStart(2, '0');
          return (
            <div style={{ background: '#f8fafc', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Timer size={14} color={W.gray500} />
                <span style={{ fontSize: 12, color: W.gray500 }}>Total Waktu Penanganan</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: W.gray900 }}>{hh}:{mm}:{ss}</span>
            </div>
          );
        })()}

        {/* Resolution details */}
        {isFinished && (ticket as any).resolution && (
          <div style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
            <p style={{ ...sectionLabel, color: '#16a34a', marginBottom: 6 }}>Resolusi / Solusi</p>
            <p style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{(ticket as any).resolution}</p>
          </div>
        )}

        {/* Branch address card */}
        {ticket.branch && (ticket.branch as any).address && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: W.orange100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building size={16} color={W.orange600} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: W.gray900 }}>{ticket.branch.name}</p>
                <p style={{ fontSize: 11, color: W.gray500, marginTop: 2, lineHeight: 1.5 }}>{(ticket.branch as any).address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {ticket.description && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
            <p style={sectionLabel}>Deskripsi</p>
            <p style={{ fontSize: 13, color: W.gray700, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>
        )}

        {/* Attachments from ticket */}
        {attachments.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Paperclip size={14} color={W.gray400} />
              <p style={{ ...sectionLabel, marginBottom: 0 }}>Lampiran ({attachments.length})</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {attachments.map((att: any) => {
                const url = att.url || (att.filepath ? STORAGE_URL + att.filepath : null);
                if (!url) return null;
                if (isImage(att.filepath || att.filename || '')) {
                  return (
                    <a key={att.id} href={url} target="_blank" rel="noreferrer"
                      style={{ display: 'block', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: `1px solid ${W.gray100b}`, flexShrink: 0 }}>
                      <img src={url} alt={att.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  );
                }
                return (
                  <a key={att.id} href={url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: W.gray50, border: `1px solid ${W.gray100b}`, borderRadius: 8, textDecoration: 'none' }}>
                    <FileText size={14} color={W.orange500} />
                    <span style={{ fontSize: 12, color: W.gray700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename || 'File'}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MessageSquare size={14} color={W.gray400} />
            <p style={{ ...sectionLabel, marginBottom: 0 }}>Komentar ({comments.length})</p>
          </div>

          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: W.gray400, textAlign: 'center', padding: '12px 0' }}>Belum ada komentar</p>
          )}

          {comments.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: W.orange100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: W.orange700, flexShrink: 0 }}>
                {c.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: W.gray900 }}>{c.user?.name || 'Unknown'}</span>
                  <span style={{ fontSize: 11, color: W.gray400 }}>{format(new Date(c.created_at), 'dd MMM · HH:mm')}</span>
                </div>
                <p style={{ fontSize: 13, color: W.gray600, lineHeight: 1.5 }}>{c.comment || c.content || c.body}</p>
                {/* Comment attachments */}
                {Array.isArray(c.attachments) && c.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {c.attachments.map((ca: any) => {
                      const url = ca.url || (ca.filepath ? STORAGE_URL + ca.filepath : null);
                      if (!url) return null;
                      return isImage(ca.filepath || ca.filename || '') ? (
                        <a key={ca.id} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', border: `1px solid ${W.gray100b}` }}>
                          <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </a>
                      ) : (
                        <a key={ca.id} href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: W.gray50, border: `1px solid ${W.gray100b}`, borderRadius: 6, textDecoration: 'none', fontSize: 11, color: W.gray600 }}>
                          <FileText size={12} color={W.orange500} />{ca.filename || 'File'}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {ticket.status !== 'closed' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${W.gray100b}` }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar…" rows={1}
                style={{ flex: 1, background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '12px', fontSize: 13, color: W.gray900, outline: 'none', resize: 'vertical', minHeight: '44px' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); commentMutation.mutate(comment.trim()); } }} />
              <label style={{ width: 44, height: 44, background: W.gray100, border: `1px solid ${W.gray200b}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Paperclip size={18} color={W.gray500} />
                <input type="file" style={{ display: 'none' }} onChange={handleAttachment} />
              </label>
              <button onClick={() => { if (comment.trim()) commentMutation.mutate(comment.trim()); }} disabled={!comment.trim() || commentMutation.isPending}
                style={{ width: 44, height: 44, background: comment.trim() ? W.orange500 : W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {commentMutation.isPending ? <Loader2 size={18} color="#fff" className="spin" /> : <Send size={18} color={comment.trim() ? '#fff' : W.gray400} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Hold Modal — Quick Presets for Field Staff */}
    {holdModalOpen && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
        <div className="page-enter" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${W.gray100b}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Tunda Tiket (Hold)</h3>
            <button onClick={() => setHoldModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: W.gray400, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ padding: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: W.gray700, marginBottom: 8 }}>Pilih Alasan Cepat:</label>
            
            {/* Quick-tap presets for deployment engineers */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                'Menunggu spare part',
                'Menunggu konfirmasi vendor',
                'Menunggu feedback user',
                'Jadwal pemeliharaan berkala',
              ].map(preset => (
                <button key={preset} type="button" onClick={() => setHoldReason(preset)}
                  style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, background: holdReason === preset ? '#fff7ed' : W.gray50, border: `1px solid ${holdReason === preset ? W.orange500 : W.gray200b}`, borderRadius: 20, color: holdReason === preset ? W.orange600 : W.gray600, cursor: 'pointer', transition: 'all 0.12s', minHeight: 44 }}>
                  {preset}
                </button>
              ))}
            </div>

            <textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} rows={3} placeholder="Tulis alasan penangguhan tambahan secara detail..."
              style={{ width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: W.gray900, outline: 'none', resize: 'none' }} />
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setHoldModalOpen(false)} style={{ flex: 1, padding: '12px', background: W.gray100, border: 'none', borderRadius: 8, color: W.gray700, fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}>Batal</button>
              <button onClick={() => holdMutation.mutate(holdReason)} disabled={!holdReason.trim() || holdMutation.isPending}
                style={{ flex: 1, padding: '12px', background: '#eab308', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: !holdReason.trim() || holdMutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 }}>
                {holdMutation.isPending ? <Loader2 size={16} className="spin" /> : null} Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Resolution Modal — Quick Resolution Input for Deployment Staff */}
    {resolutionModalOpen && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
        <div className="page-enter" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${W.gray100b}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: W.gray900 }}>Selesaikan Tiket</h3>
            <button onClick={() => setResolutionModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: W.gray400, cursor: 'pointer', lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ padding: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: W.gray700, marginBottom: 8 }}>Detail Penyelesaian / Solusi *</label>
            
            <textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} rows={4} placeholder="Tuliskan tindakan/solusi penanganan masalah..."
              style={{ width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: W.gray900, outline: 'none', resize: 'none' }} />
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setResolutionModalOpen(false)} style={{ flex: 1, padding: '12px', background: W.gray100, border: 'none', borderRadius: 8, color: W.gray700, fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}>Batal</button>
              <button onClick={() => statusMutation.mutate({ status: 'resolved', resolution: resolutionText })} disabled={!resolutionText.trim() || statusMutation.isPending}
                style={{ flex: 1, padding: '12px', background: '#16a34a', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: !resolutionText.trim() || statusMutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 }}>
                {statusMutation.isPending ? <Loader2 size={16} className="spin" /> : null} Selesai
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
