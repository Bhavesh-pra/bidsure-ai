import { apiClient } from './api';
import type { ApiResponse, Bidder } from '../types';
export const bidderService = {
  async list(): Promise<ApiResponse<Bidder[]>> { return apiClient.get('/bidders') as unknown as ApiResponse<Bidder[]>; },
  async get(id: string): Promise<ApiResponse<Bidder>> { return apiClient.get(`/bidders/${id}`) as unknown as ApiResponse<Bidder>; },
  async create(payload: Omit<Bidder, 'id'>): Promise<ApiResponse<Bidder>> { return apiClient.post('/bidders', payload) as unknown as ApiResponse<Bidder>; },
};
