import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Ticket, Monitor, Wrench, Bell, User } from 'lucide-react';

const TABS = [
  { to: '/tickets',       Icon: Ticket,  label: 'Tickets' },
  { to: '/assets',        Icon: Monitor, label: 'Assets' },
  { to: '/maintenance',   Icon: Wrench,  label: 'Maint.' },
  { to: '/notifications', Icon: Bell,    label: 'Alerts' },
  { to: '/profile',       Icon: User,    label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

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
        {TABS.map(({ to, Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} style={{ textDecoration: 'none', flex: 1 }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '10px 4px 8px',
                borderTop: active ? '2px solid #f97316' : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}>
                <Icon size={20} color={active ? '#f97316' : '#9ca3af'} />
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
