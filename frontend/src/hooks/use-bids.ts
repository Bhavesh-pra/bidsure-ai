import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bidService } from "@/services/api/bid.service";
import type {
  BidsResponse,
  BidDetailResponse,
  ApiError,
  CreateBidPayload,
  UpdateDraftBidPayload,
} from "@/types";

export const useBids = (params?: { page?: number; pageSize?: number }) => {
  return useQuery<BidsResponse, ApiError>({
    queryKey: ["bids", params?.page, params?.pageSize],
    queryFn: () => bidService.getBids(params),
  });
};

export const useBid = (id?: string) => {
  return useQuery<BidDetailResponse, ApiError>({
    queryKey: ["bids", id],
    queryFn: () => {
      if (!id) throw new Error("Bid ID is required");
      return bidService.getBidById(id);
    },
    enabled: Boolean(id),
  });
};

export const useCreateBid = () => {
  const queryClient = useQueryClient();
  return useMutation<BidDetailResponse, ApiError, CreateBidPayload>({
    mutationFn: (payload) => bidService.createBid(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
    },
  });
};

export const useUpdateDraftBid = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BidDetailResponse,
    ApiError,
    { id: string; payload: UpdateDraftBidPayload }
  >({
    mutationFn: ({ id, payload }) => bidService.updateDraftBid(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["bids", variables.id] });
    },
  });
};

export const useSubmitBid = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BidDetailResponse,
    ApiError,
    { id: string; idempotencyKey?: string }
  >({
    mutationFn: ({ id, idempotencyKey }) =>
      bidService.submitBid(id, idempotencyKey),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["bids", variables.id] });
    },
  });
};
