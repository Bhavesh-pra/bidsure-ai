import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenderService } from "@/services/api/tender.service";
import type {
  TendersResponse,
  TenderDetailResponse,
  CreateTenderInput,
  ApiError,
} from "@/types";

export const useTenders = (params?: { page?: number; pageSize?: number }) => {
  return useQuery<TendersResponse, ApiError>({
    queryKey: ["tenders", params?.page, params?.pageSize],
    queryFn: () => tenderService.getTenders(params),
  });
};

export const useTender = (id?: string) => {
  return useQuery<TenderDetailResponse, ApiError>({
    queryKey: ["tenders", id],
    queryFn: () => {
      if (!id) throw new Error("Tender ID is required");
      return tenderService.getTenderById(id);
    },
    enabled: Boolean(id),
  });
};

export const useCreateTender = () => {
  const queryClient = useQueryClient();

  return useMutation<TenderDetailResponse, ApiError, CreateTenderInput>({
    mutationFn: (input: CreateTenderInput) => tenderService.createTender(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenders"] });
    },
  });
};
