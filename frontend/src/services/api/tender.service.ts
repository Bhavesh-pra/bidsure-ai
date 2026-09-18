import { httpClient } from "./client";
import type {
  TendersResponse,
  TenderDetailResponse,
  CreateTenderInput,
  UpdateTenderMetadataInput,
  CreateTenderVersionInput,
  TenderVersionsResponse,
  TenderVersionResponse,
  CreateVersionResponse,
  RequirementDTO,
  ApiResponse,
} from "@/types";

export const tenderService = {
  getTenders: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    category?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<TendersResponse> => {
    return await httpClient.get<never, TendersResponse>("/tenders", { params });
  },

  getTenderById: async (id: string): Promise<TenderDetailResponse> => {
    return await httpClient.get<never, TenderDetailResponse>(`/tenders/${encodeURIComponent(id)}`);
  },

  createTender: async (
    input: CreateTenderInput,
    idempotencyKey?: string
  ): Promise<TenderDetailResponse> => {
    return await httpClient.post<never, TenderDetailResponse>("/tenders", input, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
  },

  updateTender: async (
    id: string,
    input: UpdateTenderMetadataInput
  ): Promise<TenderDetailResponse> => {
    return await httpClient.patch<never, TenderDetailResponse>(
      `/tenders/${encodeURIComponent(id)}`,
      input
    );
  },

  publishTender: async (id: string): Promise<TenderDetailResponse> => {
    return await httpClient.post<never, TenderDetailResponse>(
      `/tenders/${encodeURIComponent(id)}/publish`,
      {}
    );
  },

  closeTender: async (id: string): Promise<TenderDetailResponse> => {
    return await httpClient.post<never, TenderDetailResponse>(
      `/tenders/${encodeURIComponent(id)}/close`,
      {}
    );
  },

  archiveTender: async (id: string): Promise<TenderDetailResponse> => {
    return await httpClient.post<never, TenderDetailResponse>(
      `/tenders/${encodeURIComponent(id)}/archive`,
      {}
    );
  },

  getTenderVersions: async (id: string): Promise<TenderVersionsResponse> => {
    return await httpClient.get<never, TenderVersionsResponse>(
      `/tenders/${encodeURIComponent(id)}/versions`
    );
  },

  getTenderVersion: async (id: string, versionId: string): Promise<TenderVersionResponse> => {
    return await httpClient.get<never, TenderVersionResponse>(
      `/tenders/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`
    );
  },

  createTenderVersion: async (
    id: string,
    input: CreateTenderVersionInput,
    idempotencyKey?: string
  ): Promise<CreateVersionResponse> => {
    return await httpClient.post<never, CreateVersionResponse>(
      `/tenders/${encodeURIComponent(id)}/versions`,
      input,
      {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }
    );
  },

  getTenderRequirements: async (
    id: string,
    versionId?: string
  ): Promise<ApiResponse<RequirementDTO[]>> => {
    return await httpClient.get<never, ApiResponse<RequirementDTO[]>>(
      `/tenders/${encodeURIComponent(id)}/requirements`,
      { params: versionId ? { versionId } : undefined }
    );
  },
};
