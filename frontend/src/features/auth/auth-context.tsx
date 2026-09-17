import React, { createContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/api";
import type { AuthUser, LoginCredentials, UserRole } from "@/types";

export interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  organizationId: string | null;
  bidderId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await authService.getMe();
        return res.data;
      } catch {
        // Unauthenticated session (401) or network failure
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await authService.login(credentials);
      return res.data;
    },
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(["auth", "me"], loggedInUser);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSettled: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      return loginMutation.mutateAsync(credentials);
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refetchUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const authenticatedUser = user || null;
  const isAuthenticated = !!authenticatedUser;
  const role = authenticatedUser?.role || null;
  const organizationId = authenticatedUser?.organizationId || null;
  const bidderId = authenticatedUser?.bidderId || null;

  const value: AuthContextValue = {
    user: authenticatedUser,
    role,
    organizationId,
    bidderId,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
