import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedActorTypes?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedActorTypes }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');

  if (!token && !isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  // If actor type restrictions are specified, enforce them
  if (allowedActorTypes && user && !allowedActorTypes.includes(user.actor_type)) {
    // Redirect to the appropriate dashboard instead of blocking
    if (user.actor_type === 'BIDDER') {
      return <Navigate to="/bidder/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
