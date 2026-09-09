import { apiClient } from './api';
import type { ApiResponse, Document, OCRPage } from '../types';

export interface UploadDocumentParams {
  bidId: string;
  file: File;
  documentType: string;
  description?: string;
  onProgress?: (progress: number) => void;
}

export const documentService = {
  /**
   * Upload a document for a specific bid with real-time upload progress tracking.
   */
  async uploadBidDocument({
    bidId,
    file,
    documentType,
    description,
    onProgress,
  }: UploadDocumentParams): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description && description.trim()) {
      formData.append('description', description.trim());
    }

    const response = await apiClient.post(`/bids/${bidId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
    });

    return response as unknown as ApiResponse<Document>;
  },

  /**
   * List all documents uploaded for a specific bid.
   */
  async listBidDocuments(bidId: string): Promise<ApiResponse<Document[]>> {
    const response = await apiClient.get(`/bids/${bidId}/documents`);
    return response as unknown as ApiResponse<Document[]>;
  },

  /**
   * Get metadata for a single document.
   */
  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response as unknown as ApiResponse<Document>;
  },

  async processDocument(documentId: string): Promise<ApiResponse<Pick<Document, 'id' | 'processing_status'>>> {
    const response = await apiClient.post(`/documents/${documentId}/process`);
    return response as unknown as ApiResponse<Pick<Document, 'id' | 'processing_status'>>;
  },

  async getOCRPages(documentId: string): Promise<ApiResponse<{ document_id: string; pages: OCRPage[] }>> {
    const response = await apiClient.get(`/documents/${documentId}/pages`);
    return response as unknown as ApiResponse<{ document_id: string; pages: OCRPage[] }>;
  },

  async classifyDocument(documentId: string): Promise<ApiResponse<Document>> {
    const response = await apiClient.post(`/documents/${documentId}/classify`);
    return response as unknown as ApiResponse<Document>;
  },

  /**
   * Delete a document (both file storage and database record).
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response as unknown as ApiResponse<{ deleted: boolean; id: string }>;
  },
};
