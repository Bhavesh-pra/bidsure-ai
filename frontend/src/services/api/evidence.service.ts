import { httpClient } from "./client";
import type {
  BidEvidenceResponse,
  DocumentIntelligenceResponse,
  ProcessDocumentResponse,
} from "@/types";

export const evidenceService = {
  getBidEvidence: async (bidId: string): Promise<BidEvidenceResponse> => {
    return await httpClient.get<never, BidEvidenceResponse>(
      `/bids/${encodeURIComponent(bidId)}/evidence`
    );
  },

  getDocumentIntelligence: async (
    bidId: string,
    documentId: string
  ): Promise<DocumentIntelligenceResponse> => {
    return await httpClient.get<never, DocumentIntelligenceResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents/${encodeURIComponent(documentId)}/intelligence`
    );
  },

  processDocument: async (
    bidId: string,
    documentId: string
  ): Promise<ProcessDocumentResponse> => {
    return await httpClient.post<undefined, ProcessDocumentResponse>(
      `/bids/${encodeURIComponent(bidId)}/documents/${encodeURIComponent(documentId)}/process`
    );
  },
};
