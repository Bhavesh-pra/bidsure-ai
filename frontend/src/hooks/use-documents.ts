import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService, type UploadDocumentOptions } from "@/services/api/document.service";
import type {
  BidDocumentsResponse,
  BidDocumentDetailResponse,
  DeleteDocumentResponse,
  ApiError,
} from "@/types";

export const useBidDocuments = (bidId?: string) => {
  return useQuery<BidDocumentsResponse, ApiError>({
    queryKey: ["bids", bidId, "documents"],
    queryFn: () => {
      if (!bidId) throw new Error("Bid ID is required");
      return documentService.getDocuments(bidId);
    },
    enabled: Boolean(bidId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.data) return false;
      const hasTransient = data.data.some(
        (doc) =>
          doc.document.status === "SCANNING" ||
          doc.document.status === "PROCESSING" ||
          doc.document.status === "UPLOADING"
      );
      return hasTransient ? 1500 : false;
    },
  });
};

export const useBidDocument = (bidId?: string, documentId?: string) => {
  return useQuery<BidDocumentDetailResponse, ApiError>({
    queryKey: ["bids", bidId, "documents", documentId],
    queryFn: () => {
      if (!bidId || !documentId) throw new Error("Bid ID and Document ID are required");
      return documentService.getDocumentById(bidId, documentId);
    },
    enabled: Boolean(bidId && documentId),
  });
};

export const useUploadDocument = (bidId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    BidDocumentDetailResponse,
    ApiError,
    UploadDocumentOptions
  >({
    mutationFn: (options) => {
      if (!bidId) throw new Error("Bid ID is required");
      return documentService.uploadDocument(bidId, options);
    },
    onSuccess: () => {
      if (bidId) {
        queryClient.invalidateQueries({ queryKey: ["bids", bidId, "documents"] });
      }
    },
  });
};

export const useDeleteDocument = (bidId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteDocumentResponse,
    ApiError,
    string // documentId
  >({
    mutationFn: (documentId) => {
      if (!bidId) throw new Error("Bid ID is required");
      return documentService.deleteDocument(bidId, documentId);
    },
    onSuccess: () => {
      if (bidId) {
        queryClient.invalidateQueries({ queryKey: ["bids", bidId, "documents"] });
      }
    },
  });
};

export const useRetryDocument = (bidId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    BidDocumentDetailResponse,
    ApiError,
    string // documentId
  >({
    mutationFn: (documentId) => {
      if (!bidId) throw new Error("Bid ID is required");
      return documentService.retryDocument(bidId, documentId);
    },
    onSuccess: () => {
      if (bidId) {
        queryClient.invalidateQueries({ queryKey: ["bids", bidId, "documents"] });
      }
    },
  });
};
