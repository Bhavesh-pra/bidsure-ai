import type { Role, UserStatus, OrganizationStatus } from "@prisma/client";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  organizationId: string;
  bidderId?: string | null | undefined;
  organization: {
    id: string;
    name: string;
    status: OrganizationStatus;
  };
}

export interface LoginResponseData {
  user: UserDTO;
  // Included in development/test environments for programmatic test assertions;
  // in production, browser credential is exclusively in the HttpOnly cookie.
  sessionToken?: string;
}

export interface LogoutResponseData {
  loggedOut: boolean;
}
