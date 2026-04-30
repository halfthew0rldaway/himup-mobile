import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Building, Mail, User, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { W, stickyHeader } from '@/lib/design';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login', { replace: true });
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ minHeight: '100%', background: W.gray50 }} className="page-enter">
      {/* Header */}
      <div style={{ ...stickyHeader }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: W.gray900 }}>Profile</h1>
      </div>

      {/* User hero — matches web's white card with orange avatar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${W.gray100b}`, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#f97316,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: W.gray900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
          <p style={{ fontSize: 13, color: W.gray500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600, color: W.orange700, background: W.orange100, padding: '2px 10px', borderRadius: 20 }}>
            {user?.role?.name}
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Account info */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: W.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Account Info</p>
          {[
            { icon: Mail,     label: 'Email',       val: user?.email },
            { icon: Shield,   label: 'Role',        val: user?.role?.name },
            { icon: User,     label: 'Department',  val: user?.department?.name || '—' },
            { icon: Building, label: 'Branch',      val: user?.branch?.name || '—' },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Icon size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: W.gray500, width: 80, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: W.gray700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: W.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Settings</p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: W.gray700 }}>Change Password</span>
            </div>
            <ChevronRight size={16} color="#d1d5db" />
          </div>

          <div style={{ height: 1, background: W.gray100, marginBottom: 12 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color={W.gray400} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: W.gray700 }}>Email Notifications</span>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: '#f97316' }} />
          </div>
        </div>

        {/* App info */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${W.gray100b}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: W.gray400, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>App</p>
          {[
            { label: 'Version', val: '1.0.0' },
            { label: 'Environment', val: import.meta.env.MODE },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: W.gray600 }}>{label}</span>
              <span style={{ fontSize: 12, color: W.gray700, fontFamily: 'monospace', background: W.gray100, padding: '2px 8px', borderRadius: 6 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Logout button — matches web's destructive style */}
        <button onClick={handleLogout} className="press"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid #fecaca`, borderRadius: 12, padding: '13px 16px', cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={17} color="#ef4444" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', flex: 1, textAlign: 'left' }}>Sign Out</span>
          <ChevronRight size={16} color="#fca5a5" />
        </button>
      </div>
    </div>
  );
};
