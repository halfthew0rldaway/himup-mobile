import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

// Roles allowed to use this mobile app
const ALLOWED_SLUGS = ['it_operations_staff', 'super-admin', 'super_admin', 'admin', 'manager'];

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'himup-mobile-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export const isAllowedRole = (slug: string) => ALLOWED_SLUGS.includes(slug);
