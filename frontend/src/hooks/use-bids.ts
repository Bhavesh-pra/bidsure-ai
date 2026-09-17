import { useQuery } from "@tanstack/react-query";
import { bidService } from "@/services/api/bid.service";
import type { BidsResponse, BidDetailResponse, ApiError } from "@/types";

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
