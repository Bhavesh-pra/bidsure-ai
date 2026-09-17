import { apiClient } from './api';
import type { ApiResponse, Evidence } from '../types';

export const evidenceService = {
  async extract(documentId: string): Promise<ApiResponse<{ document_id: string; fields: Evidence[]; extraction_status: string }>> {
    const response = await apiClient.post(`/documents/${documentId}/extract`);
    return response as unknown as ApiResponse<{ document_id: string; fields: Evidence[]; extraction_status: string }>;
  },
  async listForBid(bidId: string): Promise<ApiResponse<{ bid_id: string; evidence: Evidence[] }>> {
    const response = await apiClient.get(`/bids/${bidId}/evidence`);
    return response as unknown as ApiResponse<{ bid_id: string; evidence: Evidence[] }>;
  },
  async get(evidenceId: string): Promise<ApiResponse<Evidence>> {
    const response = await apiClient.get(`/evidence/${evidenceId}`);
    return response as unknown as ApiResponse<Evidence>;
  },
};
