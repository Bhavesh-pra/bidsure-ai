import { apiClient } from './api';
import { Tender, ApiResponse } from '../types';

export const tenderService = {
  async getAllTenders(): Promise<ApiResponse<{ tenders: Tender[] }>> {
    const response = await apiClient.get('/tenders');
    return response as unknown as ApiResponse<{ tenders: Tender[] }>;
  },

  async getTenderById(id: string): Promise<ApiResponse<Tender>> {
    const response = await apiClient.get(`/tenders/${id}`);
    return response as unknown as ApiResponse<Tender>;
  },

  async createTender(tender: Partial<Tender>): Promise<ApiResponse<Tender>> {
    const response = await apiClient.post('/tenders', tender);
    return response as unknown as ApiResponse<Tender>;
  },
};
