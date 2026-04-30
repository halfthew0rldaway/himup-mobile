import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { notificationService } from '@/services';
import { formatDistanceToNow } from 'date-fns';
import { W, stickyHeader } from '@/lib/design';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

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
            <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900, lineHeight: 1 }}>Notifications</h1>
            <p style={{ fontSize: 12, color: W.gray500, marginTop: 2 }}>{unread} unread</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className="press"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: W.orange600, background: W.orange50, border: `1px solid ${W.orange100}`, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
            {markAllMutation.isPending ? <Loader2 size={13} className="spin" /> : <CheckCheck size={13} />}
            Mark all read
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
              <p style={{ fontWeight: 600, color: W.gray700 }}>No notifications</p>
              <p style={{ fontSize: 12, color: W.gray400, marginTop: 4 }}>You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif: any, i: number) => (
                <div key={notif.id} onClick={() => { if (!notif.read_at) markOneMutation.mutate(notif.id); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', cursor: 'pointer', background: notif.read_at ? 'transparent' : W.orange50, borderTop: i > 0 ? `1px solid ${W.gray50}` : 'none', borderLeft: notif.read_at ? 'none' : `3px solid ${W.orange500}`, transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { if (notif.read_at) e.currentTarget.style.background = W.gray50; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = notif.read_at ? 'transparent' : W.orange50; }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: notif.read_at ? W.gray200b : W.orange500, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: notif.read_at ? W.gray600 : W.gray900, lineHeight: 1.5, fontWeight: notif.read_at ? 400 : 500 }}>
                      {notif.data?.message || notif.data?.body || 'New notification'}
                    </p>
                    <p style={{ fontSize: 11, color: W.gray400, marginTop: 3 }}>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
