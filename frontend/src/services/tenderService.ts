import { apiClient } from './api';
import { ApiResponse, CreateTenderPayload, Tender } from '../types';

export const tenderService = {
  async getTenders(): Promise<ApiResponse<Tender[]>> {
    const response = await apiClient.get('/tenders');
    const payload = response as unknown as ApiResponse<Tender[] | { tenders: Tender[] }>;
    const data = Array.isArray(payload.data) ? payload.data : payload.data.tenders;
    return { ...payload, data };
  },

  async getTender(id: string): Promise<ApiResponse<Tender>> {
    const response = await apiClient.get(`/tenders/${id}`);
    return response as unknown as ApiResponse<Tender>;
  },

  async createTender(tender: CreateTenderPayload): Promise<ApiResponse<Tender>> {
    const response = await apiClient.post('/tenders', tender);
    return response as unknown as ApiResponse<Tender>;
  },

  // Backwards-compatible aliases for existing consumers.
  getAllTenders: async () => tenderService.getTenders(),
  getTenderById: async (id: string) => tenderService.getTender(id),
};
