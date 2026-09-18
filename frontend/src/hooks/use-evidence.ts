import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { evidenceService } from "@/services/api/evidence.service";
import type {
  BidEvidenceResponse,
  DocumentIntelligenceResponse,
  ProcessDocumentResponse,
  ApiError,
} from "@/types";

export const useBidEvidence = (bidId?: string) => {
  return useQuery<BidEvidenceResponse, ApiError>({
    queryKey: ["bids", bidId, "evidence"],
    queryFn: () => {
      if (!bidId) throw new Error("Bid ID is required");
      return evidenceService.getBidEvidence(bidId);
    },
    enabled: Boolean(bidId),
    refetchInterval: (query) => {
      const data = query.state.data;
      // If evidence is empty, poll lightly to catch initial processing completion
      if (data && data.data.totalEvidence === 0 && data.data.documentsCount > 0) {
        return 3000;
      }
      return false;
    },
  });
};

export const useDocumentIntelligence = (bidId?: string, documentId?: string) => {
  return useQuery<DocumentIntelligenceResponse, ApiError>({
    queryKey: ["bids", bidId, "documents", documentId, "intelligence"],
    queryFn: () => {
      if (!bidId || !documentId) throw new Error("Bid ID and Document ID are required");
      return evidenceService.getDocumentIntelligence(bidId, documentId);
    },
    enabled: Boolean(bidId && documentId),
    refetchInterval: (query) => {
      const ocrStatus = query.state.data?.data?.ocr?.status;
      if (ocrStatus === "PENDING" || ocrStatus === "PROCESSING") {
        return 2000;
      }
      return false;
    },
  });
};

export const useProcessDocument = (bidId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    ProcessDocumentResponse,
    ApiError,
    string // documentId
  >({
    mutationFn: (documentId: string) => {
      if (!bidId) throw new Error("Bid ID is required");
      return evidenceService.processDocument(bidId, documentId);
    },
    onSuccess: (_, documentId) => {
      if (bidId) {
        queryClient.invalidateQueries({ queryKey: ["bids", bidId, "evidence"] });
        queryClient.invalidateQueries({
          queryKey: ["bids", bidId, "documents", documentId, "intelligence"],
        });
      }
    },
  });
};
