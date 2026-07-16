import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Ticket, Monitor, Wrench, Bell, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const { data } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: notificationService.getAll,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const unread = (data?.data || []).filter((n: any) => !n.read_at).length;

  const TABS = [
    { to: '/tickets',       Icon: Ticket,  label: 'Tickets',   badge: 0 },
    { to: '/assets',        Icon: Monitor, label: 'Assets',    badge: 0 },
    { to: '/maintenance',   Icon: Wrench,  label: 'Maint.',    badge: 0 },
    { to: '/notifications', Icon: Bell,    label: 'Alerts',    badge: unread },
    { to: '/profile',       Icon: User,    label: 'Profile',   badge: 0 },
  ];

  return (
    <nav style={{
      background: '#ffffff',
      borderTop: '1px solid #f3f4f6',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      flexShrink: 0,
      boxShadow: '0 -1px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {TABS.map(({ to, Icon, label, badge }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '12px 4px 10px',
                minHeight: 56,
                borderTop: active ? '2px solid #f97316' : '2px solid transparent',
                transition: 'border-color 0.15s',
                position: 'relative',
              }}>
                <div style={{ position: 'relative' }}>
                  <Icon size={20} color={active ? '#f97316' : '#9ca3af'} />
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -6,
                      minWidth: 14, height: 14, background: '#ef4444',
                      borderRadius: 7, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 8, fontWeight: 700,
                      color: '#fff', border: '1.5px solid #fff', padding: '0 2px',
                    }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#f97316' : '#9ca3af',
                }}>
                  {label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
