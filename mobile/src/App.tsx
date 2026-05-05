import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { AssetsPage } from '@/pages/AssetsPage';
import { AssetDetailPage } from '@/pages/AssetDetailPage';
import { AssetScannerPage } from '@/pages/AssetScannerPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { MaintenanceDetailPage } from '@/pages/MaintenanceDetailPage';
import { MaintenanceCreatePage } from '@/pages/MaintenanceCreatePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TicketCreatePage } from '@/pages/TicketCreatePage';
import { Wrench } from 'lucide-react';

const NoAccess: React.FC = () => (
  <div style={{ minHeight: '100dvh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
    <div style={{ width: 72, height: 72, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Wrench size={32} color="#f87171" />
    </div>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 10 }}>Access Denied</h1>
    <p style={{ fontSize: 14, color: '#64748b', maxWidth: 300, lineHeight: 1.6, marginBottom: 24 }}>
      This app is for IT Operations Staff and Engineers only. Please use the web portal.
    </p>
    <a href="/login" style={{ color: '#f97316', fontSize: 14, textDecoration: 'underline' }}>Back to Login</a>
  </div>
);

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/no-access" element={<NoAccess />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tickets" replace />} />

        {/* Tickets */}
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/create" element={<TicketCreatePage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />

        {/* Assets */}
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/scan" element={<AssetScannerPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />

        {/* Maintenance */}
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/create" element={<MaintenanceCreatePage />} />
        <Route path="maintenance/:id" element={<MaintenanceDetailPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  </BrowserRouter>
);
