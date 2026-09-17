import { httpClient } from "./client";
import type { BidsResponse, BidDetailResponse } from "@/types";

export const bidService = {
  getBids: async (params?: { page?: number; pageSize?: number }): Promise<BidsResponse> => {
    return await httpClient.get<never, BidsResponse>("/bids", { params });
  },

  getBidById: async (id: string): Promise<BidDetailResponse> => {
    return await httpClient.get<never, BidDetailResponse>(`/bids/${encodeURIComponent(id)}`);
  },
};
