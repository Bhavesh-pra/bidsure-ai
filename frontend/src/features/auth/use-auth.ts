import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";

const defaultAuthValue: AuthContextValue = {
  user: null,
  role: null,
  organizationId: null,
  bidderId: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {},
  refetchUser: async () => {},
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  return context ?? defaultAuthValue;
};
