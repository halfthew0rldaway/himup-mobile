import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useTicketNotifications } from '@/hooks/useTicketNotifications';

export const AppShell: React.FC = () => {
  useTicketNotifications();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', overflow: 'hidden', background: '#f9fafb' }}>
    <main className="scrollable" style={{ flex: 1, width: '100%', paddingBottom: 70, overflowX: 'hidden' }}>
      <Outlet />
    </main>
    <BottomNav />
  </div>
  );
};
