import { requirementRepository, RequirementRepository } from "./requirement.repository.js";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "../../shared/errors/app-error.js";
import { can, type Action } from "../../shared/auth/permissions.js";
import type { TenantContext } from "../../shared/auth/tenant-context.js";
import type {
  ListRequirementsQuery,
  RequirementDTO,
  RequirementVersionDTO,
} from "./requirement.types.js";
import { buildCollectionMeta } from "../../shared/pagination/pagination.helper.js";
import { getQueueService } from "../../infrastructure/queue/queue.service.js";
import { processRequirementExtractJob } from "../../workers/requirement-extraction.worker.js";
import { auditService } from "../../shared/audit/audit.service.js";
import { logger } from "../../infrastructure/logging/logger.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export class RequirementService {
  constructor(private readonly repository: RequirementRepository = requirementRepository) {
    // Register worker with queue service for asynchronous BullMQ execution
    getQueueService().registerWorker("processing.queue", processRequirementExtractJob);
  }

  /**
   * Helper to verify user permissions using centralized Phase 04/10 authorization policy.
   * Denies access by default; strictly enforces role boundaries.
   */
  private assertAuthorized(
    tenant: TenantContext | undefined,
    action: Action,
    entity?: { organizationId?: string; [key: string]: unknown }
  ): asserts tenant is TenantContext {
    if (!tenant) {
      throw new UnauthorizedError("Authentication is required to access requirements");
    }

    const user = {
      id: tenant.userId,
      email: tenant.email,
      role: tenant.role,
      organizationId: tenant.organizationId,
      bidderId: tenant.bidderId,
      name: "",
      status: "ACTIVE" as const,
      organization: { id: tenant.organizationId, name: "", status: "ACTIVE" as const },
    };

    if (!can(user, action, "requirement", entity)) {
      throw new ForbiddenError(`You do not have permission to ${action} requirements`);
    }
  }

  /**
   * Transform raw database record to RequirementDTO.
   */
  private formatRequirement(r: any): RequirementDTO {
    const currentVer = r.currentVersion || (r.versions && r.versions[0]) || null;
    const formattedCurrentVersion: RequirementVersionDTO | null = currentVer
      ? {
          id: currentVer.id,
          requirementId: currentVer.requirementId,
          tenderVersionId: currentVer.tenderVersionId,
          versionNumber: currentVer.versionNumber,
          status: currentVer.status,
          category: currentVer.category,
          title: currentVer.title || r.identifier,
          description: currentVer.description,
          mandatory: currentVer.mandatory,
          condition: currentVer.condition,
          operator: currentVer.operator,
          threshold: currentVer.threshold as Record<string, unknown> | null,
          expectedValue: currentVer.expectedValue,
          requiredEvidenceType: currentVer.requiredEvidenceType,
          source: {
            documentId: currentVer.sourceDocumentId,
            documentName: currentVer.sourceDocument?.fileName,
            page: currentVer.sourcePage,
            clauseRef: currentVer.sourceClause,
            text: currentVer.sourceText,
            location: currentVer.sourceLocation,
          },
          effectiveFrom: currentVer.effectiveFrom?.toISOString?.() || null,
          effectiveTo: currentVer.effectiveTo?.toISOString?.() || null,
          ai: {
            generated: currentVer.aiGenerated,
            model: currentVer.aiModel,
            modelVersion: currentVer.aiModelVersion,
            confidence: currentVer.aiConfidence,
          },
          createdBy: currentVer.createdBy,
          createdByName: currentVer.createdByUser?.name,
          approvedBy: currentVer.approvedBy,
          approvedByName: currentVer.approvedByUser?.name,
          approvedAt: currentVer.approvedAt?.toISOString?.() || null,
          rejectionReason: currentVer.rejectionReason,
          supersedesVersionId: currentVer.supersedesVersionId,
          ruleMapping:
            currentVer.complianceRules && currentVer.complianceRules[0]
              ? {
                  id: currentVer.complianceRules[0].id,
                  ruleId: currentVer.complianceRules[0].ruleType,
                  ruleVersion: currentVer.complianceRules[0].version,
                  operator: currentVer.complianceRules[0].operator,
                  expectedValue: currentVer.complianceRules[0].expectedValue,
                  parameters: (currentVer.complianceRules[0].parameters as Record<string, unknown>) || {},
                  enabled: currentVer.complianceRules[0].enabled,
                  createdAt: currentVer.complianceRules[0].createdAt.toISOString(),
                }
              : null,
          createdAt: currentVer.createdAt.toISOString(),
        }
      : null;

    return {
      id: r.id,
      organizationId: r.organizationId,
      tenderId: r.tenderId,
      tenderVersionId: r.tenderVersionId,
      identifier: r.identifier,
      category: r.category,
      currentVersionId: r.currentVersionId,
      currentVersion: formattedCurrentVersion,
      versionsCount: r._count?.versions ?? (r.versions ? r.versions.length : 1),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  /**
   * List requirements for a tender version with bounded pagination and filtering.
   */
  async listRequirements(
    tenderId: string,
    versionId: string,
    query: ListRequirementsQuery,
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "read");

    const { total, items } = await this.repository.findMany(tenderId, versionId, query, tenant);

    return {
      items: items.map((i) => this.formatRequirement(i)),
      meta: buildCollectionMeta(total, query.page || 1, query.pageSize || 20),
    };
  }

  /**
   * Get single requirement by ID with full details.
   */
  async getRequirementById(requirementId: string, tenant?: TenantContext): Promise<RequirementDTO> {
    this.assertAuthorized(tenant, "read");

    const requirement = await this.repository.findById(requirementId, tenant);
    if (!requirement) {
      throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
    }

    return this.formatRequirement(requirement);
  }

  /**
   * Get full chronological version history for a requirement.
   */
  async getVersionHistory(requirementId: string, tenant?: TenantContext) {
    this.assertAuthorized(tenant, "read");

    const versions = await this.repository.findVersionHistory(requirementId, tenant);

    return versions.map((v) => ({
      id: v.id,
      requirementId: v.requirementId,
      versionNumber: v.versionNumber,
      status: v.status,
      category: v.category,
      title: v.title,
      description: v.description,
      mandatory: v.mandatory,
      operator: v.operator,
      threshold: v.threshold as Record<string, unknown> | null,
      expectedValue: v.expectedValue,
      requiredEvidenceType: v.requiredEvidenceType,
      sourceClause: v.sourceClause,
      sourcePage: v.sourcePage,
      sourceText: v.sourceText,
      sourceDocumentId: v.sourceDocumentId,
      sourceDocumentName: v.sourceDocument?.fileName,
      aiGenerated: v.aiGenerated,
      aiConfidence: v.aiConfidence,
      createdBy: v.createdBy,
      createdByName: v.createdByUser?.name,
      approvedBy: v.approvedBy,
      approvedByName: v.approvedByUser?.name,
      approvedAt: v.approvedAt?.toISOString?.() || null,
      rejectionReason: v.rejectionReason,
      supersedesVersionId: v.supersedesVersionId,
      ruleMapping: v.complianceRules?.[0]
        ? {
            id: v.complianceRules[0].id,
            ruleId: v.complianceRules[0].ruleType,
            ruleVersion: v.complianceRules[0].version,
          }
        : null,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  /**
   * Trigger asynchronous requirement extraction job via BullMQ.
   */
  async extractRequirements(
    tenderId: string,
    versionId: string,
    input: { documentId?: string | undefined },
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "create");

    // Verify tender version exists and belongs to tenant
    const tenderVersion = await prisma.tenderVersion.findFirst({
      where: {
        id: versionId,
        tenderId,
        tender: { organizationId: tenant.organizationId },
      },
    });

    if (!tenderVersion) {
      throw new NotFoundError(`Tender version ${versionId} not found`);
    }

    const deterministicKey = `REQUIREMENT_EXTRACT:${versionId}:${input.documentId || "default"}`;
    const queueService = getQueueService();

    await queueService.enqueue(
      "processing.queue",
      "REQUIREMENT_EXTRACT",
      {
        type: "REQUIREMENT_EXTRACT",
        tenderId,
        tenderVersionId: versionId,
        documentId: input.documentId,
        organizationId: tenant.organizationId,
        userId: tenant.userId,
        attempt: 1,
      },
      { jobId: deterministicKey }
    );

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "REQUIREMENT_EXTRACTION_REQUESTED",
      entityType: "TENDER_VERSION",
      entityId: versionId,
      metadata: {
        tenderId,
        documentId: input.documentId,
        jobId: deterministicKey,
      },
    });

    return {
      status: "PROCESSING",
      jobId: deterministicKey,
      tenderVersionId: versionId,
    };
  }

  /**
   * Create a manual requirement draft for a tender version.
   */
  async createRequirement(
    tenderId: string,
    versionId: string,
    input: any,
    tenant?: TenantContext
  ): Promise<RequirementDTO> {
    this.assertAuthorized(tenant, "create");

    const { requirementId, versionId: createdVerId } = await this.repository.createRequirement(
      tenderId,
      versionId,
      input,
      tenant
    );

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "REQUIREMENT_CREATED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      newState: {
        requirementId,
        versionId: createdVerId,
        identifier: input.identifier,
        status: "PROPOSED",
        title: input.title,
      },
    });

    return this.getRequirementById(requirementId, tenant);
  }

  /**
   * Update requirement draft or create new version if approved.
   */
  async updateRequirement(
    requirementId: string,
    input: any,
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "update");

    const result = await this.repository.updateRequirement(requirementId, input, tenant);

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: result.wasNewVersionCreated ? "REQUIREMENT_VERSION_CREATED" : "REQUIREMENT_EDITED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      newState: {
        versionId: result.version.id,
        versionNumber: result.version.versionNumber,
        status: result.version.status,
      },
    });

    const fullReq = await this.getRequirementById(requirementId, tenant);
    return {
      requirement: fullReq,
      wasNewVersionCreated: result.wasNewVersionCreated,
    };
  }

  /**
   * Approve requirement (Human reviewer / Procurement Officer action).
   */
  async approveRequirement(
    requirementId: string,
    input: { expectedCurrentVersionId: string; notes?: string | undefined },
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "approve");

    const approvedVersion = await this.repository.approveRequirement(
      requirementId,
      input.expectedCurrentVersionId,
      tenant
    );

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "REQUIREMENT_APPROVED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      newState: {
        versionId: approvedVersion.id,
        versionNumber: approvedVersion.versionNumber,
        status: approvedVersion.status,
        approvedBy: tenant.userId,
      },
      metadata: {
        notes: input.notes,
      },
    });

    return this.getRequirementById(requirementId, tenant);
  }

  /**
   * Reject requirement proposal with mandatory reason.
   */
  async rejectRequirement(
    requirementId: string,
    input: { expectedCurrentVersionId: string; rejectionReason: string },
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "review");

    const rejectedVersion = await this.repository.rejectRequirement(
      requirementId,
      input.expectedCurrentVersionId,
      input.rejectionReason,
      tenant
    );

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "REQUIREMENT_REJECTED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      newState: {
        versionId: rejectedVersion.id,
        versionNumber: rejectedVersion.versionNumber,
        status: rejectedVersion.status,
        rejectionReason: input.rejectionReason,
      },
    });

    return this.getRequirementById(requirementId, tenant);
  }

  /**
   * Map requirement to an explicit controlled compliance rule.
   */
  async mapRule(
    requirementId: string,
    input: any,
    tenant?: TenantContext
  ) {
    this.assertAuthorized(tenant, "update");

    const rule = await this.repository.mapRule(requirementId, input, tenant);

    // Audit log
    await auditService.logEvent({
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "REQUIREMENT_RULE_MAPPED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      newState: {
        ruleId: rule.ruleType,
        ruleVersion: rule.version,
        requirementVersionId: rule.requirementVersionId,
      },
    });

    return this.getRequirementById(requirementId, tenant);
  }
}

export const requirementService = new RequirementService();
