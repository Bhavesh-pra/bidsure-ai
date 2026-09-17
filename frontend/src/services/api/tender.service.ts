import { httpClient } from "./client";
import type {
  TendersResponse,
  TenderDetailResponse,
  CreateTenderInput,
} from "@/types";

export const tenderService = {
  getTenders: async (params?: { page?: number; pageSize?: number }): Promise<TendersResponse> => {
    return await httpClient.get<never, TendersResponse>("/tenders", { params });
  },

  getTenderById: async (id: string): Promise<TenderDetailResponse> => {
    return await httpClient.get<never, TenderDetailResponse>(`/tenders/${encodeURIComponent(id)}`);
  },

  createTender: async (input: CreateTenderInput): Promise<TenderDetailResponse> => {
    return await httpClient.post<never, TenderDetailResponse>("/tenders", input);
  },
};
