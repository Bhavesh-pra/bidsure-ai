import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenderService } from "@/services/api/tender.service";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  TendersResponse,
  TenderDetailResponse,
  CreateTenderInput,
  ApiError,
} from "@/types";

export const useTenders = (params?: { page?: number; pageSize?: number }) => {
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
