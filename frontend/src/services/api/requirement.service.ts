import { httpClient } from "./client";
import type {
  RequirementsResponse,
  RequirementDetailResponse,
  RequirementVersionsResponse,
  RuleCatalogResponse,
  RequirementDTO,
  ListRequirementsQuery,
  CreateRequirementInput,
  UpdateRequirementInput,
  ApproveRequirementInput,
  RejectRequirementInput,
  MapRuleInput,
  ExtractRequirementsInput,
  AsyncJobResponse,
  ApiResponse,
} from "@/types";

export const requirementService = {
  /**
   * Get registered rules from the controlled compliance rule catalog.
   */
  getRuleCatalog: async (): Promise<RuleCatalogResponse> => {
    return await httpClient.get<never, RuleCatalogResponse>("/requirements/rules/catalog");
  },

  /**
   * List requirements for a specific tender version with bounded pagination & filtering.
   */
  getRequirementsByTenderVersion: async (
    tenderId: string,
    versionId: string,
    params?: ListRequirementsQuery
  ): Promise<RequirementsResponse> => {
    return await httpClient.get<never, RequirementsResponse>(
      `/tenders/${encodeURIComponent(tenderId)}/versions/${encodeURIComponent(versionId)}/requirements`,
      { params }
    );
  },

  /**
   * Get single requirement by ID with its authoritative current version.
   */
  getRequirementById: async (id: string): Promise<RequirementDetailResponse> => {
    return await httpClient.get<never, RequirementDetailResponse>(
      `/requirements/${encodeURIComponent(id)}`
    );
  },

  /**
   * Get full chronological version history (v2, v1) for an audit-immutable requirement.
   */
  getRequirementVersionHistory: async (id: string): Promise<RequirementVersionsResponse> => {
    return await httpClient.get<never, RequirementVersionsResponse>(
      `/requirements/${encodeURIComponent(id)}/versions`
    );
  },

  /**
   * Trigger asynchronous requirement extraction job via BullMQ.
   */
  extractRequirements: async (
    tenderId: string,
    versionId: string,
    input: ExtractRequirementsInput
  ): Promise<ApiResponse<AsyncJobResponse>> => {
    return await httpClient.post<never, ApiResponse<AsyncJobResponse>>(
      `/tenders/${encodeURIComponent(tenderId)}/versions/${encodeURIComponent(versionId)}/requirements/extract`,
      input
    );
  },

  /**
   * Create a requirement draft manually (Human-authored in PROPOSED status).
   */
  createRequirement: async (
    tenderId: string,
    versionId: string,
    input: CreateRequirementInput
  ): Promise<RequirementDetailResponse> => {
    return await httpClient.post<never, RequirementDetailResponse>(
      `/tenders/${encodeURIComponent(tenderId)}/versions/${encodeURIComponent(versionId)}/requirements`,
      input
    );
  },

  /**
   * Update a requirement.
   * If requirement is in PROPOSED / IN_REVIEW, edits current version.
   * If requirement is APPROVED, creates a new version (v2) in IN_REVIEW, preserving historical v1.
   * Requires expectedCurrentVersionId for optimistic concurrency.
   */
  updateRequirement: async (
    id: string,
    input: UpdateRequirementInput
  ): Promise<ApiResponse<{ requirement: RequirementDTO; wasNewVersionCreated: boolean }>> => {
    return await httpClient.patch<never, ApiResponse<{ requirement: RequirementDTO; wasNewVersionCreated: boolean }>>(
      `/requirements/${encodeURIComponent(id)}`,
      input
    );
  },

  /**
   * Explicit Human Reviewer approval action.
   * Promotes requirement to APPROVED status.
   * Requires expectedCurrentVersionId + presence of source clause, source page, and rule mapping.
   */
  approveRequirement: async (
    id: string,
    input: ApproveRequirementInput
  ): Promise<RequirementDetailResponse> => {
    return await httpClient.post<never, RequirementDetailResponse>(
      `/requirements/${encodeURIComponent(id)}/approve`,
      input
    );
  },

  /**
   * Reject a proposed requirement.
   * Moves to terminal REJECTED status with mandatory rejection reason.
   */
  rejectRequirement: async (
    id: string,
    input: RejectRequirementInput
  ): Promise<RequirementDetailResponse> => {
    return await httpClient.post<never, RequirementDetailResponse>(
      `/requirements/${encodeURIComponent(id)}/reject`,
      input
    );
  },

  /**
   * Map or re-map requirement to a rule in the controlled compliance catalog.
   */
  mapComplianceRule: async (
    id: string,
    input: MapRuleInput
  ): Promise<RequirementDetailResponse> => {
    return await httpClient.put<never, RequirementDetailResponse>(
      `/requirements/${encodeURIComponent(id)}/rule-mapping`,
      input
    );
  },
};
