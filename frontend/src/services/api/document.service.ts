import { httpClient } from "./client";
import type {
  BidDocumentsResponse,
  BidDocumentDetailResponse,
  DeleteDocumentResponse,
} from "@/types";

export interface UploadDocumentOptions {
  file: File;
  documentType: string;
  supersedesDocumentId?: string;
  onUploadProgress?: (progressPercentage: number) => void;
}

export const documentService = {
  getDocuments: async (bidId: string): Promise<BidDocumentsResponse> => {
    return await httpClient.get<never, BidDocumentsResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents`
    );
  },

  getDocumentById: async (
    bidId: string,
    documentId: string
  ): Promise<BidDocumentDetailResponse> => {
    return await httpClient.get<never, BidDocumentDetailResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents/${encodeURIComponent(documentId)}`
    );
  },

  uploadDocument: async (
    bidId: string,
    options: UploadDocumentOptions
  ): Promise<BidDocumentDetailResponse> => {
    const formData = new FormData();
    formData.append("file", options.file);
    formData.append("documentType", options.documentType);
    if (options.supersedesDocumentId) {
      formData.append("supersedesDocumentId", options.supersedesDocumentId);
    }

    return await httpClient.post<FormData, BidDocumentDetailResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (options.onUploadProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onUploadProgress(percentage);
          }
        },
      }
    );
  },

  deleteDocument: async (
    bidId: string,
    documentId: string
  ): Promise<DeleteDocumentResponse> => {
    return await httpClient.delete<never, DeleteDocumentResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents/${encodeURIComponent(documentId)}`
    );
  },

  retryDocument: async (
    bidId: string,
    documentId: string
  ): Promise<BidDocumentDetailResponse> => {
    return await httpClient.post<undefined, BidDocumentDetailResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents/${encodeURIComponent(documentId)}/retry`
    );
  },
};
