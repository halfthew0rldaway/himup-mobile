import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services';
import { useAuthStore, isAllowedRole } from '@/store/auth.store';
import { W, primaryBtn } from '@/lib/design';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/tickets';

  const mutation = useMutation({
    mutationFn: () => authService.login(email, password),
    onSuccess: (data) => {
      if (!isAllowedRole(data.user?.role?.slug)) { setRoleError(true); return; }
      setAuth(data.user, data.token);
      navigate(from, { replace: true });
    },
  });

  const errorMessage = roleError
    ? 'This app is for IT Operations Staff only. Use the web portal instead.'
    : mutation.isError
    ? ((mutation.error as any)?.response?.data?.message || 'Login failed. Please try again.')
    : null;

  const borderFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = W.orange500);
  const borderBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = W.gray200b);

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fef2f2 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo + title — matches web exactly */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, margin: '0 auto 16px', borderRadius: 24, background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(249, 115, 22, 0.1)' }}>
            <img src="https://himup.id/logo.png" alt="HiMup Logo"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
            />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: W.gray900, marginBottom: 4 }}>HiMup</h1>
          <p style={{ fontSize: 13, color: W.gray600 }}>Asset Maintenance Tracking System</p>
        </div>

        {/* Card — white, rounded-2xl, shadow-xl — matches web */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>

          {errorMessage && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); setRoleError(false); mutation.mutate(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: W.gray700, marginBottom: 6 }}>Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="your@email.com"
                onFocus={borderFocus} onBlur={borderBlur}
                style={{ width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, color: W.gray900, outline: 'none', transition: 'border-color 0.15s' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: W.gray700, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  onFocus={borderFocus} onBlur={borderBlur}
                  style={{ width: '100%', background: W.gray50, border: `1px solid ${W.gray200b}`, borderRadius: 8, padding: '11px 44px 11px 14px', fontSize: 14, color: W.gray900, outline: 'none', transition: 'border-color 0.15s' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: W.gray400, padding: 4 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -4 }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#f97316', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: 13, color: W.gray600, cursor: 'pointer', userSelect: 'none' }}>
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={mutation.isPending} className="press"
              style={{ ...primaryBtn, marginTop: 4, opacity: mutation.isPending ? 0.7 : 1, padding: '13px' }}>
              {mutation.isPending
                ? <><Loader2 size={16} className="spin" /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: W.gray500, marginTop: 20 }}>
          © {new Date().getFullYear()} HiMup • IT Operations &amp; Engineers only
        </p>
      </div>
    </div>
  );
};
