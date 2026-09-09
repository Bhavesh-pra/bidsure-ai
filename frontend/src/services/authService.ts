import { apiClient } from './api';
import type { ApiResponse } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    actor_type: string;
    organization_id: string;
    organization_name?: string;
    organization_type?: string;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  actor_type: string;
  organization_id: string;
  organization_name?: string;
  organization_type?: string;
  status: string;
}

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/login', { email, password }) as unknown as ApiResponse<LoginResponse>;
  },

  async getMe(): Promise<ApiResponse<MeResponse>> {
    return apiClient.get('/auth/me') as unknown as ApiResponse<MeResponse>;
  },
};
