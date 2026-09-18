import { tenderRepository, TenderRepository } from "./tender.repository.js";
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from "../../shared/errors/app-error.js";
import { can } from "../../shared/auth/permissions.js";
import type {
  PaginationParams,
  TenantContext,
  CreateTenderInput,
  UpdateTenderInput,
  CreateTenderVersionInput,
  TenderDTO,
  TenderVersionDTO,
  RequirementDTO,
} from "./tender.types.js";
import { buildCollectionMeta } from "../../shared/pagination/pagination.helper.js";
import { logger } from "../../infrastructure/logging/logger.js";
import type { TenderStatus } from "@prisma/client";

export class TenderService {
  constructor(private readonly repository: TenderRepository = tenderRepository) {}

  /** Helper to verify user permissions using centralized Phase 04 authorization policy */
  private assertAuthorized(
    tenant: TenantContext | undefined,
    action: "read" | "create" | "update" | "publish" | "delete",
    resource = "tender" as const,
    entity?: { organizationId?: string; [key: string]: unknown }
  ) {
    if (!tenant) return; // If unauthenticated demo/test mode without tenant context
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

    if (!can(user, action, resource, entity)) {
      throw new ForbiddenError(`You do not have permission to ${action} tenders`);
    }
  }

  /** Retrieve paginated list of tenders */
  async listTenders(params: PaginationParams, tenant?: TenantContext) {
    this.assertAuthorized(tenant, "read", "tender");

    const { total, items } = await this.repository.findMany(params, tenant);

    const formatted: TenderDTO[] = items.map((t) => {
      const latestVersion = t.versions[0];
      return {
        id: t.id,
        organizationId: t.organizationId,
        title: t.title,
        referenceNumber: t.referenceNumber,
        category: t.category,
        department: t.department,
        status: t.status,
        currentVersionId: t.currentVersionId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        currentVersion: latestVersion
          ? {
              id: latestVersion.id,
              tenderId: t.id,
              versionNumber: latestVersion.versionNumber,
              title: latestVersion.title,
              description: latestVersion.description,
              content: null,
              changeSummary: latestVersion.changeSummary,
              status: latestVersion.status,
              createdAt: latestVersion.createdAt.toISOString(),
            }
          : null,
        versionsCount: t._count.versions,
      };
    });

    return {
      items: formatted,
      meta: buildCollectionMeta(total, params.page, params.pageSize),
    };
  }

  /** Retrieve single tender by ID */
  async getTenderById(id: string, tenant?: TenantContext): Promise<TenderDTO> {
    this.assertAuthorized(tenant, "read", "tender");

    const tender = await this.repository.findById(id, tenant);
    if (!tender) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    const currentVersionRecord = tender.versions.find((v) => v.id === tender.currentVersionId) || tender.versions[0];

    return {
      id: tender.id,
      organizationId: tender.organizationId,
      title: tender.title,
      referenceNumber: tender.referenceNumber,
      category: tender.category,
      department: tender.department,
      status: tender.status,
      currentVersionId: tender.currentVersionId,
      createdAt: tender.createdAt.toISOString(),
      updatedAt: tender.updatedAt.toISOString(),
      currentVersion: currentVersionRecord
        ? {
            id: currentVersionRecord.id,
            tenderId: tender.id,
            versionNumber: currentVersionRecord.versionNumber,
            title: currentVersionRecord.title,
            description: currentVersionRecord.description,
            content: currentVersionRecord.content,
            changeSummary: currentVersionRecord.changeSummary,
            status: currentVersionRecord.status,
            createdAt: currentVersionRecord.createdAt.toISOString(),
            isCurrent: currentVersionRecord.id === tender.currentVersionId,
            requirements: currentVersionRecord.requirements?.map((r) => {
              const reqV = r.versions[0];
              return {
                id: r.id,
                identifier: r.identifier,
                category: r.category,
                createdAt: r.createdAt.toISOString(),
                currentVersion: reqV
                  ? {
                      versionNumber: reqV.versionNumber,
                      description: reqV.description,
                      mandatory: reqV.mandatory,
                    }
                  : undefined,
              };
            }),
          }
        : null,
      versionsCount: tender.versions.length,
    };
  }

  /** Create new tender with initial version in one atomic transaction */
  async createTender(input: CreateTenderInput, tenant?: TenantContext): Promise<TenderDTO> {
    this.assertAuthorized(tenant, "create", "tender");

    const orgId = tenant?.organizationId || (await this.repository.getDefaultOrganizationId());

    // Check for reference duplicate within organization
    const existing = await this.repository.findByReference(input.referenceNumber, orgId);
    if (existing) {
      throw new ConflictError(
        `A tender with reference number "${input.referenceNumber}" already exists in this organization`
      );
    }

    const created = await this.repository.createWithInitialVersion({
      ...input,
      organizationId: orgId,
    });

    logger.info(
      {
        event: "TENDER_CREATED",
        tenderId: created.id,
        referenceNumber: created.referenceNumber,
        organizationId: orgId,
        actorId: tenant?.userId,
      },
      "Tender created with initial version 1"
    );

    return this.getTenderById(created.id, tenant);
  }

  /** Update allowed mutable metadata */
  async updateMetadata(id: string, input: UpdateTenderInput, tenant?: TenantContext): Promise<TenderDTO> {
    this.assertAuthorized(tenant, "update", "tender");

    const tender = await this.repository.findById(id, tenant);
    if (!tender) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    await this.repository.updateMetadata(id, input, tenant);

    logger.info(
      {
        event: "TENDER_UPDATED",
        tenderId: id,
        organizationId: tender.organizationId,
        actorId: tenant?.userId,
      },
      "Tender administrative metadata updated"
    );

    return this.getTenderById(id, tenant);
  }

  /** Transition tender procurement lifecycle state machine */
  async transitionLifecycle(
    id: string,
    targetStatus: "PUBLISHED" | "CLOSED" | "ARCHIVED",
    tenant?: TenantContext
  ): Promise<TenderDTO> {
    const actionRequired = targetStatus === "PUBLISHED" ? "publish" : "update";
    this.assertAuthorized(tenant, actionRequired, "tender");

    const tender = await this.repository.findById(id, tenant);
    if (!tender) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    // Explicit state machine transitions
    const validTransitions: Record<TenderStatus, TenderStatus[]> = {
      DRAFT: ["PUBLISHED", "ARCHIVED"],
      PUBLISHED: ["CLOSED", "ARCHIVED"],
      CLOSED: ["ARCHIVED"],
      ARCHIVED: [],
    };

    const currentStatus = tender.status as TenderStatus;
    const allowedNext = validTransitions[currentStatus] || [];

    if (!allowedNext.includes(targetStatus)) {
      throw new ConflictError(
        `Illegal lifecycle transition: Cannot move tender from ${currentStatus} to ${targetStatus}`
      );
    }

    await this.repository.updateStatus(id, targetStatus, tenant);

    logger.info(
      {
        event: "TENDER_LIFECYCLE_CHANGED",
        tenderId: id,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        organizationId: tender.organizationId,
        actorId: tenant?.userId,
      },
      `Tender transitioned from ${currentStatus} to ${targetStatus}`
    );

    return this.getTenderById(id, tenant);
  }

  /** List historical versions for a tender */
  async listVersions(tenderId: string, tenant?: TenantContext): Promise<TenderVersionDTO[]> {
    this.assertAuthorized(tenant, "read", "tender");

    const { currentVersionId, versions } = await this.repository.listVersions(tenderId, tenant);

    return versions.map((v) => ({
      id: v.id,
      tenderId: v.tenderId,
      versionNumber: v.versionNumber,
      title: v.title,
      description: v.description,
      content: v.content,
      changeSummary: v.changeSummary,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
      isCurrent: v.id === currentVersionId,
      requirements: v.requirements?.map((r) => {
        const reqV = r.versions[0];
        return {
          id: r.id,
          identifier: r.identifier,
          category: r.category,
          createdAt: r.createdAt.toISOString(),
          currentVersion: reqV
            ? {
                versionNumber: reqV.versionNumber,
                description: reqV.description,
                mandatory: reqV.mandatory,
              }
            : undefined,
        };
      }),
    }));
  }

  /** Get specific historical version snapshot */
  async getVersionById(tenderId: string, versionId: string, tenant?: TenantContext): Promise<TenderVersionDTO> {
    this.assertAuthorized(tenant, "read", "tender");

    const { isCurrent, version } = await this.repository.findVersionById(tenderId, versionId, tenant);

    return {
      id: version.id,
      tenderId: version.tenderId,
      versionNumber: version.versionNumber,
      title: version.title,
      description: version.description,
      content: version.content,
      changeSummary: version.changeSummary,
      status: version.status,
      createdAt: version.createdAt.toISOString(),
      isCurrent,
      requirements: version.requirements?.map((r) => {
        const reqV = r.versions[0];
        return {
          id: r.id,
          identifier: r.identifier,
          category: r.category,
          createdAt: r.createdAt.toISOString(),
          currentVersion: reqV
            ? {
                versionNumber: reqV.versionNumber,
                description: reqV.description,
                mandatory: reqV.mandatory,
              }
            : undefined,
        };
      }),
    };
  }

  /** Create new TenderVersion with row locking and atomic currentVersionId update */
  async createVersion(
    tenderId: string,
    input: CreateTenderVersionInput,
    tenant?: TenantContext
  ): Promise<{ tender: TenderDTO; version: TenderVersionDTO }> {
    this.assertAuthorized(tenant, "create", "tender");

    const result = await this.repository.createVersion(tenderId, input, tenant);

    logger.info(
      {
        event: "TENDER_VERSION_CREATED",
        tenderId,
        newVersionId: result.version.id,
        versionNumber: result.version.versionNumber,
        actorId: tenant?.userId,
      },
      `Created version ${result.version.versionNumber} for tender ${tenderId}`
    );

    const fullTender = await this.getTenderById(tenderId, tenant);
    const fullVersion = await this.getVersionById(tenderId, result.version.id, tenant);

    return {
      tender: fullTender,
      version: fullVersion,
    };
  }

  /** Read-only boundary for requirements under a tender version */
  async getRequirements(tenderId: string, versionId?: string, tenant?: TenantContext): Promise<RequirementDTO[]> {
    this.assertAuthorized(tenant, "read", "tender");

    let targetVersionId = versionId;
    if (!targetVersionId) {
      const tender = await this.getTenderById(tenderId, tenant);
      if (!tender.currentVersionId) {
        return [];
      }
      targetVersionId = tender.currentVersionId;
    }

    const version = await this.getVersionById(tenderId, targetVersionId, tenant);
    return version.requirements || [];
  }
}

export const tenderService = new TenderService();
