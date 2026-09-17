export type UserRole =
  | "PROCUREMENT_OFFICER"
  | "BIDDER"
  | "REVIEWER"
  | "AUDITOR"
  | "ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  bidderId?: string | null;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
