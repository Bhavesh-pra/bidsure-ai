import { apiClient } from './api';
import type { ApiResponse, Bid } from '../types';

export const bidService = {
  async list(tenderId: string): Promise<ApiResponse<{ tender_id: string; bids: Bid[] }>> {
    return apiClient.get(`/tenders/${tenderId}/bids`) as unknown as ApiResponse<{ tender_id: string; bids: Bid[] }>;
  },

  async listAll(): Promise<ApiResponse<{ bids: Bid[] }>> {
    try {
      return await apiClient.get('/bids') as unknown as ApiResponse<{ bids: Bid[] }>;
    } catch (error: any) {
      // Keep the shell usable while the aggregate-bids endpoint is unavailable.
      if (error?.code === 'NETWORK_ERROR' || error?.code === 'NOT_FOUND' || error?.code === 'NOT_IMPLEMENTED') {
        return { success: true, data: { bids: [] }, request_id: 'MOCK-BIDS-LIST' };
      }
      throw error;
    }
  },

  async get(id: string): Promise<ApiResponse<Bid>> {
    return apiClient.get(`/bids/${id}`) as unknown as ApiResponse<Bid>;
  },

  async create(
    tenderId: string,
    payload: Pick<Bid, 'bidder_id' | 'quoted_amount'> & { proposed_completion_date?: string }
  ): Promise<ApiResponse<Bid>> {
    return apiClient.post(`/tenders/${tenderId}/bids`, payload) as unknown as ApiResponse<Bid>;
  },
};
