import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requirementService } from "@/services/api/requirement.service";
import { queryKeys } from "@/lib/query/query-keys";
import type {
  RequirementsResponse,
  RequirementDetailResponse,
  RequirementVersionsResponse,
  RuleCatalogResponse,
  ListRequirementsQuery,
  CreateRequirementInput,
  UpdateRequirementInput,
  ApproveRequirementInput,
  RejectRequirementInput,
  MapRuleInput,
  ExtractRequirementsInput,
  ApiError,
  ApiResponse,
  AsyncJobResponse,
} from "@/types";

/**
 * Hook to retrieve the controlled compliance rule catalog.
 */
export const useRuleCatalog = () => {
  return useQuery<RuleCatalogResponse, ApiError>({
    queryKey: queryKeys.requirements.catalog(),
    queryFn: () => requirementService.getRuleCatalog(),
    staleTime: 15 * 60 * 1000, // 15 mins cache
  });
};

/**
 * Hook to list requirements for a tender version with bounded pagination & filtering.
 */
export const useRequirementsByTenderVersion = (
  tenderId?: string,
  versionId?: string,
  params?: ListRequirementsQuery
) => {
  return useQuery<RequirementsResponse, ApiError>({
    queryKey: queryKeys.requirements.byTenderVersion(tenderId ?? "", versionId ?? "", params as any),
    queryFn: () => {
      if (!tenderId || !versionId) throw new Error("tenderId and versionId are required");
      return requirementService.getRequirementsByTenderVersion(tenderId, versionId, params);
    },
    enabled: Boolean(tenderId && versionId),
  });
};

/**
 * Hook to fetch single requirement details with its active version.
 */
export const useRequirement = (id?: string) => {
  return useQuery<RequirementDetailResponse, ApiError>({
    queryKey: queryKeys.requirements.detail(id ?? ""),
    queryFn: () => {
      if (!id) throw new Error("Requirement ID is required");
      return requirementService.getRequirementById(id);
    },
    enabled: Boolean(id),
  });
};

/**
 * Hook to fetch version history for evidentiary immutability review.
 */
export const useRequirementVersions = (id?: string) => {
  return useQuery<RequirementVersionsResponse, ApiError>({
    queryKey: queryKeys.requirements.versions(id ?? ""),
    queryFn: () => {
      if (!id) throw new Error("Requirement ID is required");
      return requirementService.getRequirementVersionHistory(id);
    },
    enabled: Boolean(id),
  });
};

/**
 * Hook to trigger asynchronous requirement extraction via BullMQ.
 */
export const useExtractRequirements = (tenderId: string, versionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<AsyncJobResponse>, ApiError, ExtractRequirementsInput>({
    mutationFn: (input) => requirementService.extractRequirements(tenderId, versionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["requirements", "tender", tenderId, "version", versionId],
      });
    },
  });
};

/**
 * Hook to manually create a draft requirement.
 */
export const useCreateRequirement = (tenderId: string, versionId: string) => {
  const queryClient = useQueryClient();

  return useMutation<RequirementDetailResponse, ApiError, CreateRequirementInput>({
    mutationFn: (input) => requirementService.createRequirement(tenderId, versionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["requirements", "tender", tenderId, "version", versionId],
      });
    },
  });
};

/**
 * Hook to edit a requirement (optimistic concurrency protected).
 */
export const useUpdateRequirement = (id: string, tenderId?: string, versionId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ requirement: any; wasNewVersionCreated: boolean }>,
    ApiError,
    UpdateRequirementInput
  >({
    mutationFn: (input) => requirementService.updateRequirement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.versions(id) });
      if (tenderId && versionId) {
        queryClient.invalidateQueries({
          queryKey: ["requirements", "tender", tenderId, "version", versionId],
        });
      }
    },
  });
};

/**
 * Hook to approve a requirement (advisory -> approved human review gate).
 */
export const useApproveRequirement = (id: string, tenderId?: string, versionId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<RequirementDetailResponse, ApiError, ApproveRequirementInput>({
    mutationFn: (input) => requirementService.approveRequirement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.versions(id) });
      if (tenderId && versionId) {
        queryClient.invalidateQueries({
          queryKey: ["requirements", "tender", tenderId, "version", versionId],
        });
      }
    },
  });
};

/**
 * Hook to reject a requirement draft with reason.
 */
export const useRejectRequirement = (id: string, tenderId?: string, versionId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<RequirementDetailResponse, ApiError, RejectRequirementInput>({
    mutationFn: (input) => requirementService.rejectRequirement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.versions(id) });
      if (tenderId && versionId) {
        queryClient.invalidateQueries({
          queryKey: ["requirements", "tender", tenderId, "version", versionId],
        });
      }
    },
  });
};

/**
 * Hook to map or re-map a controlled compliance rule.
 */
export const useMapComplianceRule = (id: string, tenderId?: string, versionId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<RequirementDetailResponse, ApiError, MapRuleInput>({
    mutationFn: (input) => requirementService.mapComplianceRule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requirements.versions(id) });
      if (tenderId && versionId) {
        queryClient.invalidateQueries({
          queryKey: ["requirements", "tender", tenderId, "version", versionId],
        });
      }
    },
  });
};
