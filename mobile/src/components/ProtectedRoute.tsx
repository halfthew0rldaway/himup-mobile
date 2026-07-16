import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, isAllowedRole } from '@/store/auth.store';

interface Props { children: React.ReactNode; }

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !isAllowedRole(user.role?.slug)) {
    return <Navigate to="/no-access" replace />;
  }

  return <>{children}</>;
};
