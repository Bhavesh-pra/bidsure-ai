import { apiClient } from './api';
import { ApiResponse, CreateTenderPayload, Document, Requirement, Tender } from '../types';
import type { ComplianceRule } from '../types/rule';

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

  async uploadDocument(tenderId: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ document_id: string; tender_id: string; filename: string; status: string; requirements_count: number }>> {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post(`/tenders/${tenderId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => { if (event.total && onProgress) onProgress(Math.round((event.loaded / event.total) * 100)); },
    });
    return response as unknown as ApiResponse<{ document_id: string; tender_id: string; filename: string; status: string; requirements_count: number }>;
  },

  async getDocuments(tenderId: string): Promise<ApiResponse<Document[]>> {
    const response = await apiClient.get(`/tenders/${tenderId}/documents`);
    return response as unknown as ApiResponse<Document[]>;
  },

  async getRequirements(tenderId: string): Promise<ApiResponse<{ tender_id: string; requirements: Requirement[] }>> {
    const response = await apiClient.get(`/tenders/${tenderId}/requirements`);
    return response as unknown as ApiResponse<{ tender_id: string; requirements: Requirement[] }>;
  },

  async getRules(tenderId: string): Promise<ApiResponse<{ tender_id: string; rules: ComplianceRule[] }>> {
    const response = await apiClient.get(`/tenders/${tenderId}/rules`);
    return response as unknown as ApiResponse<{ tender_id: string; rules: ComplianceRule[] }>;
  },

  async generateRules(tenderId: string): Promise<ApiResponse<{ tender_id: string; rules: ComplianceRule[] }>> {
    const response = await apiClient.post(`/tenders/${tenderId}/rules/generate`);
    return response as unknown as ApiResponse<{ tender_id: string; rules: ComplianceRule[] }>;
  },

  async getRequirementRules(requirementId: string): Promise<ApiResponse<ComplianceRule[]>> {
    const response = await apiClient.get(`/requirements/${requirementId}/rules`);
    return response as unknown as ApiResponse<ComplianceRule[]>;
  },

  // Backwards-compatible aliases for existing consumers.
  getAllTenders: async () => tenderService.getTenders(),
  getTenderById: async (id: string) => tenderService.getTender(id),
};
