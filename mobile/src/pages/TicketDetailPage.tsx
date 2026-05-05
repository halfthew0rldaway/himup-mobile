import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Tag, Building, Clock, MessageSquare, Send, Paperclip, CheckCircle, Loader2, Timer, UserCheck, FileText, Image } from 'lucide-react';
import { ticketService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { format, formatDistanceStrict } from 'date-fns';
import type { Ticket } from '@/types';
import { W, stickyHeader, sectionLabel } from '@/lib/design';

const STORAGE_URL = 'https://api.himup.id/storage/';

const STATUS_INLINE: Record<string, { background: string; color: string }> = {
  open:        { background: '#fff7ed', color: '#c2410c' },
  in_progress: { background: '#dbeafe', color: '#1d4ed8' },
  resolved:    { background: '#f0fdf4', color: '#15803d' },
  closed:      { background: '#f3f4f6', color: '#374151' },
  on_hold:     { background: '#fefce8', color: '#a16207' },
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

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getOne(Number(id)),
    enabled: !!id,
    refetchInterval: 15000,
  });

  // Live SLA timer — counts from created_at while not yet closed
  useEffect(() => {
    if (!ticket || ticket.status === 'closed' || ticket.status === 'resolved') return;
    const update = () => setElapsed(Date.now() - new Date(ticket.created_at).getTime());
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [ticket?.created_at, ticket?.status]);

  const isActive = ticket?.status === 'in_progress';
  const slaLimit = ticket ? (SLA_MS[ticket.priority] ?? SLA_MS.medium) : 0;
  const slaPercent = slaLimit ? Math.min((elapsed / slaLimit) * 100, 100) : 0;
  const isFinished = ticket?.status === 'closed' || ticket?.status === 'resolved';
  const slaBreached = elapsed > slaLimit && !isFinished;

  const takeOwnershipMutation = useMutation({
    mutationFn: () => ticketService.takeOwnership(Number(id), user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => ticketService.updateStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => ticketService.addComment(Number(id), body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticket', id] }); setComment(''); },
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
  const canTakeOwnership = ticket.status === 'open' && !ticket.pic;

  return (
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

          {/* Resolved/Closed resolution time */}
          {isFinished && (ticket as any).closed_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, background: '#f0fdf4', borderRadius: 8, padding: '8px 12px' }}>
              <CheckCircle size={13} color="#16a34a" />
              <span style={{ fontSize: 12, color: '#15803d' }}>
                Diselesaikan dalam {formatDistanceStrict(new Date(ticket.created_at), new Date((ticket as any).closed_at))}
              </span>
            </div>
          )}

          {/* Take Ownership */}
          {canTakeOwnership && (
            <button onClick={() => takeOwnershipMutation.mutate()} disabled={takeOwnershipMutation.isPending} className="press"
              style={{ width: '100%', padding: '11px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(124,58,237,0.3)', marginBottom: 10, opacity: takeOwnershipMutation.isPending ? 0.7 : 1 }}>
              {takeOwnershipMutation.isPending ? <><Loader2 size={15} className="spin" /> Memproses…</> : <><UserCheck size={15} />Ambil Kepemilikan</>}
            </button>
          )}

          {/* Status action button */}
          {next && (
            <button onClick={() => statusMutation.mutate(next.next)} disabled={statusMutation.isPending} className="press"
              style={{ width: '100%', padding: '11px', background: next.bg, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 12px ${next.shadow}`, opacity: statusMutation.isPending ? 0.7 : 1 }}>
              {statusMutation.isPending ? <><Loader2 size={15} className="spin" /> Memperbarui…</> : <><CheckCircle size={15} />{next.label}</>}
            </button>
          )}
        </div>

        {/* Info */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <p style={sectionLabel}>Detail</p>
          {[
            { icon: User,     label: 'Requester',   val: ticket.requester?.name },
            { icon: UserCheck,label: 'Ditugaskan',  val: ticket.pic?.name || '— Belum ada —' },
            { icon: Tag,      label: 'Kategori',    val: ticket.category?.name },
            { icon: Building, label: 'Branch',      val: ticket.branch?.name },
            { icon: Clock,    label: 'Dibuat',      val: ticket.created_at ? format(new Date(ticket.created_at), 'dd MMM yyyy · HH:mm') : '' },
          ].filter(i => i.val).map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Icon size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: W.gray500, width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: W.gray700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            </div>
          ))}
        </div>

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
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar…"
                style={{ flex: 1, background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: W.gray900, outline: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); commentMutation.mutate(comment.trim()); } }} />
              <label style={{ width: 36, height: 36, background: W.gray100, border: `1px solid ${W.gray200b}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Paperclip size={15} color={W.gray500} />
                <input type="file" style={{ display: 'none' }} onChange={handleAttachment} />
              </label>
              <button onClick={() => { if (comment.trim()) commentMutation.mutate(comment.trim()); }} disabled={!comment.trim() || commentMutation.isPending}
                style={{ width: 36, height: 36, background: comment.trim() ? W.orange500 : W.gray100, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {commentMutation.isPending ? <Loader2 size={14} color="#fff" className="spin" /> : <Send size={14} color={comment.trim() ? '#fff' : W.gray400} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
