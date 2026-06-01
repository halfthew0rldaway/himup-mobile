import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, CheckCheck, Ticket, Wrench, UserCheck, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { notificationService } from '@/services';
import { formatDistanceToNow } from 'date-fns';
import { W, stickyHeader } from '@/lib/design';

// Map notification type to icon + color
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  ticket_created:    { icon: <Ticket size={16} color="#f97316" />, bg: '#fff7ed', color: '#f97316' },
  ticket_assigned:   { icon: <UserCheck size={16} color="#2563eb" />, bg: '#eff6ff', color: '#2563eb' },
  ticket_updated:    { icon: <AlertCircle size={16} color="#8b5cf6" />, bg: '#f5f3ff', color: '#8b5cf6' },
  maintenance_created:  { icon: <Wrench size={16} color="#f97316" />, bg: '#fff7ed', color: '#f97316' },
  maintenance_approved: { icon: <Wrench size={16} color="#16a34a" />, bg: '#f0fdf4', color: '#16a34a' },
  maintenance_rejected: { icon: <Wrench size={16} color="#dc2626" />, bg: '#fef2f2', color: '#dc2626' },
  transfer_created:  { icon: <ArrowRightLeft size={16} color="#0891b2" />, bg: '#ecfeff', color: '#0891b2' },
  transfer_status_updated: { icon: <ArrowRightLeft size={16} color="#8b5cf6" />, bg: '#f5f3ff', color: '#8b5cf6' },
};

const DEFAULT_CONFIG = { icon: <Bell size={16} color="#6b7280" />, bg: '#f9fafb', color: '#6b7280' };

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data || [];
  const unread = notifications.filter((n: any) => !n.read_at).length;

  const handleTap = (notif: any) => {
    if (!notif.read_at) markOneMutation.mutate(notif.id);
    // Navigate to related item if possible
    const d = notif.data || {};
    if (d.ticket_id) {
      navigate(`/tickets/${d.ticket_id}`);
    } else if (d.maintenance_id) {
      navigate(`/maintenance/${d.maintenance_id}`);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      {/* Header */}
      <div style={{ ...stickyHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)', position: 'relative' }}>
            <Bell size={20} color="#fff" />
            {unread > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '2px solid #fff' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900, lineHeight: 1 }}>Notifikasi</h1>
            <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>{unread} belum dibaca</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className="press"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: W.orange600, background: W.orange50, border: `1px solid ${W.orange100}`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
            {markAllMutation.isPending ? <Loader2 size={13} className="spin" /> : <CheckCheck size={13} />}
            Tandai semua
          </button>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: W.orange100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Bell size={24} color={W.orange500} />
              </div>
              <p style={{ fontWeight: 600, color: W.gray700 }}>Tidak ada notifikasi</p>
              <p style={{ fontSize: 12, color: W.gray400, marginTop: 4 }}>Semua sudah terbaca!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif: any, i: number) => {
                const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
                const d = notif.data || {};
                // Build detail text from available fields
                const title = notif.title || d.title || 'Notifikasi';
                const message = notif.message || d.message || d.body || '';
                const ticketNumber = d.ticket_number || '';
                const assetTag = d.asset_tag || '';

                return (
                  <div key={notif.id} onClick={() => handleTap(notif)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                      cursor: 'pointer',
                      background: notif.read_at ? 'transparent' : '#fffbf5',
                      borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none',
                      borderLeft: notif.read_at ? 'none' : `3px solid ${W.orange500}`,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (notif.read_at) e.currentTarget.style.background = W.gray50; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = notif.read_at ? 'transparent' : '#fffbf5'; }}
                  >
                    {/* Icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: notif.read_at ? 500 : 600, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {title}
                        </span>
                        {!notif.read_at && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: W.orange500, flexShrink: 0 }} />
                        )}
                      </div>

                      {/* Message body */}
                      {message && (
                        <p style={{ fontSize: 12, color: W.gray600, lineHeight: 1.5, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {message}
                        </p>
                      )}

                      {/* Meta tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {ticketNumber && (
                          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: W.orange600, background: W.orange50, padding: '1px 6px', borderRadius: 4 }}>
                            {ticketNumber}
                          </span>
                        )}
                        {assetTag && (
                          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: '#8b5cf6', background: '#f5f3ff', padding: '1px 6px', borderRadius: 4 }}>
                            {assetTag}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: W.gray400 }}>
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
