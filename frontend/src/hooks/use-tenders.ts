import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenderService } from "@/services/api/tender.service";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  TendersResponse,
  TenderDetailResponse,
  TenderVersionsResponse,
  TenderVersionResponse,
  CreateVersionResponse,
  CreateTenderInput,
  UpdateTenderMetadataInput,
  CreateTenderVersionInput,
  RequirementDTO,
  ApiResponse,
  ApiError,
} from "@/types";

export const useTenders = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery<TendersResponse, ApiError>({
    queryKey: queryKeys.tenders.list(params),
    queryFn: () => tenderService.getTenders(params),
  });
};

export const useTender = (id?: string) => {
  return useQuery<TenderDetailResponse, ApiError>({
    queryKey: queryKeys.tenders.detail(id ?? ""),
    queryFn: () => {
      if (!id) throw new Error("Tender ID is required");
      return tenderService.getTenderById(id);
    },
    enabled: Boolean(id),
  });
};

export const useTenderVersions = (tenderId?: string) => {
  return useQuery<TenderVersionsResponse, ApiError>({
    queryKey: queryKeys.tenders.versions(tenderId ?? ""),
    queryFn: () => {
      if (!tenderId) throw new Error("Tender ID is required");
      return tenderService.getTenderVersions(tenderId);
    },
    enabled: Boolean(tenderId),
  });
};

export const useTenderVersion = (tenderId?: string, versionId?: string) => {
  return useQuery<TenderVersionResponse, ApiError>({
    queryKey: queryKeys.tenders.version(tenderId ?? "", versionId ?? ""),
    queryFn: () => {
      if (!tenderId || !versionId) throw new Error("Tender ID and Version ID are required");
      return tenderService.getTenderVersion(tenderId, versionId);
    },
    enabled: Boolean(tenderId && versionId),
  });
};

export const useTenderRequirements = (tenderId?: string, versionId?: string) => {
  return useQuery<ApiResponse<RequirementDTO[]>, ApiError>({
    queryKey: queryKeys.tenders.requirements(tenderId ?? "", versionId),
    queryFn: () => {
      if (!tenderId) throw new Error("Tender ID is required");
      return tenderService.getTenderRequirements(tenderId, versionId);
    },
    enabled: Boolean(tenderId),
  });
};

export interface CreateTenderMutationVariables {
  input: CreateTenderInput;
  idempotencyKey?: string;
}

export const useCreateTender = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TenderDetailResponse,
    ApiError,
    CreateTenderInput | CreateTenderMutationVariables
  >({
    mutationFn: (variables: CreateTenderInput | CreateTenderMutationVariables) => {
      if ("input" in variables && typeof variables.input === "object") {
        return tenderService.createTender(variables.input, variables.idempotencyKey);
      }
      return tenderService.createTender(variables as CreateTenderInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};

export const useUpdateTender = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TenderDetailResponse,
    ApiError,
    { id: string; input: UpdateTenderMetadataInput }
  >({
    mutationFn: ({ id, input }) => tenderService.updateTender(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};

export const usePublishTender = () => {
  const queryClient = useQueryClient();

  return useMutation<TenderDetailResponse, ApiError, string>({
    mutationFn: (id: string) => tenderService.publishTender(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.versions(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};

export const useCloseTender = () => {
  const queryClient = useQueryClient();

  return useMutation<TenderDetailResponse, ApiError, string>({
    mutationFn: (id: string) => tenderService.closeTender(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};

export const useArchiveTender = () => {
  const queryClient = useQueryClient();

  return useMutation<TenderDetailResponse, ApiError, string>({
    mutationFn: (id: string) => tenderService.archiveTender(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};

export interface CreateVersionMutationVariables {
  tenderId: string;
  input: CreateTenderVersionInput;
  idempotencyKey?: string;
}

export const useCreateTenderVersion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateVersionResponse, ApiError, CreateVersionMutationVariables>({
    mutationFn: ({ tenderId, input, idempotencyKey }) =>
      tenderService.createTenderVersion(tenderId, input, idempotencyKey),
    onSuccess: (_, { tenderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(tenderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.versions(tenderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.lists() });
    },
  });
};
