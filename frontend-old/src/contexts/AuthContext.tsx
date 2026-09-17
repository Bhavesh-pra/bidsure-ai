import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  actor_type: string;
  organization_id: string;
  organization_name?: string;
  organization_type?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isOfficer: boolean;
  isBidder: boolean;
  isAdmin: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isOfficer: false,
  isBidder: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('bidsure_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token') || localStorage.getItem('token')
  );

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('bidsure_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('bidsure_user');
    setToken(null);
    setUser(null);
    window.location.assign('/login');
  }, []);

  // Revalidate on mount if token exists but user is missing
  useEffect(() => {
    if (token && !user) {
      apiClient.get('/auth/me')
        .then((response: any) => {
          const data = response?.data || response;
          if (data?.id) {
            const rehydrated: AuthUser = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role,
              actor_type: data.actor_type || 'GOVERNMENT',
              organization_id: data.organization_id,
              organization_name: data.organization_name,
              organization_type: data.organization_type,
            };
            localStorage.setItem('bidsure_user', JSON.stringify(rehydrated));
            setUser(rehydrated);
          }
        })
        .catch(() => {
          // Token invalid — clear everything
          logout();
        });
    }
  }, [token, user, logout]);

  const isAuthenticated = !!token && !!user;
  const isOfficer = user?.actor_type === 'GOVERNMENT' || user?.role === 'PROCUREMENT_OFFICER';
  const isBidder = user?.actor_type === 'BIDDER';
  const isAdmin = user?.role === 'ADMIN' || user?.actor_type === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isOfficer, isBidder, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
