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
    organization_id: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/login', { email, password }) as unknown as ApiResponse<LoginResponse>;
  },
};
