import { httpClient } from "./client";
import type {
  BidsResponse,
  BidDetailResponse,
  CreateBidPayload,
  UpdateDraftBidPayload,
} from "@/types";

export const bidService = {
  getBids: async (params?: { page?: number; pageSize?: number }): Promise<BidsResponse> => {
    return await httpClient.get<never, BidsResponse>("/bids", { params });
  },

  getBidById: async (id: string): Promise<BidDetailResponse> => {
    return await httpClient.get<never, BidDetailResponse>(`/bids/${encodeURIComponent(id)}`);
  },

  createBid: async (payload: CreateBidPayload): Promise<BidDetailResponse> => {
    return await httpClient.post<CreateBidPayload, BidDetailResponse>("/bids", payload);
  },

  updateDraftBid: async (
    id: string,
    payload: UpdateDraftBidPayload
  ): Promise<BidDetailResponse> => {
    return await httpClient.patch<UpdateDraftBidPayload, BidDetailResponse>(
      `/bids/${encodeURIComponent(id)}`,
      payload
    );
  },

  submitBid: async (id: string, idempotencyKey?: string): Promise<BidDetailResponse> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    return await httpClient.post<undefined, BidDetailResponse>(
      `/bids/${encodeURIComponent(id)}/submit`,
      undefined,
      { headers }
    );
  },
};
