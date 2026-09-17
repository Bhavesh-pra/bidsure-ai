export type UserRole = "OFFICER" | "BIDDER" | "ADMIN" | "AUDITOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
