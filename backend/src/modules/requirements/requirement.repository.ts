import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma, RequirementStatus, RequirementCategory, RequirementOperator } from "@prisma/client";
import { BaseRepository } from "../../shared/database/base.repository.js";
import { NotFoundError, ConflictError, ValidationError } from "../../shared/errors/app-error.js";
import type { TenantContext } from "../../shared/auth/tenant-context.js";
import type {
  ListRequirementsQuery,
  RequirementDTO,
  RequirementVersionDTO,
} from "./requirement.types.js";
import { isValidRuleId, getRuleCatalogItem } from "./requirement.rule-catalog.js";

export class RequirementRepository extends BaseRepository {
  /**
   * Find requirements for a tender version with bounded pagination, filters, and tenant scoping.
   */
  async findMany(
    tenderId: string,
    tenderVersionId: string,
    query: ListRequirementsQuery,
    tenant?: TenantContext | undefined
  ) {
    const {
      page = 1,
      pageSize = 20,
      status,
      category,
      mandatory,
      ruleMapped,
      confidenceTier,
      search,
      sortBy = "createdAt",
      sortOrder = "asc",
    } = query;

    const skip = (page - 1) * pageSize;

    const where: Prisma.RequirementWhereInput = {
      tenderId,
      tenderVersionId,
      ...(tenant?.organizationId ? { organizationId: tenant.organizationId } : {}),
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { identifier: { contains: search, mode: "insensitive" } },
              {
                versions: {
                  some: {
                    OR: [
                      { title: { contains: search, mode: "insensitive" } },
                      { description: { contains: search, mode: "insensitive" } },
                      { sourceClause: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
      ...(status || mandatory !== undefined || confidenceTier || ruleMapped !== undefined
        ? {
            versions: {
              some: {
                ...(status ? { status } : {}),
                ...(mandatory !== undefined ? { mandatory } : {}),
                ...(confidenceTier === "LOW"
                  ? { aiConfidence: { lt: 0.7 } }
                  : confidenceTier === "MEDIUM"
                  ? { aiConfidence: { gte: 0.7, lt: 0.9 } }
                  : confidenceTier === "HIGH"
                  ? { aiConfidence: { gte: 0.9 } }
                  : {}),
                ...(ruleMapped !== undefined
                  ? ruleMapped
                    ? { complianceRules: { some: {} } }
                    : { complianceRules: { none: {} } }
                  : {}),
              },
            },
          }
        : {}),
    };

    const orderBy: Prisma.RequirementOrderByWithRelationInput[] =
      sortBy === "identifier"
        ? [{ identifier: sortOrder }, { id: "asc" }]
        : [{ createdAt: sortOrder }, { id: "asc" }];

    const [total, items] = await Promise.all([
      prisma.requirement.count({ where }),
      prisma.requirement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          organization: { select: { id: true, name: true } },
          currentVersion: {
            include: {
              sourceDocument: { select: { id: true, fileName: true } },
              createdByUser: { select: { id: true, name: true } },
              approvedByUser: { select: { id: true, name: true } },
              complianceRules: {
                where: { enabled: true },
                orderBy: { version: "desc" },
                take: 1,
              },
            },
          },
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            include: {
              sourceDocument: { select: { id: true, fileName: true } },
              createdByUser: { select: { id: true, name: true } },
              approvedByUser: { select: { id: true, name: true } },
              complianceRules: {
                where: { enabled: true },
                orderBy: { version: "desc" },
                take: 1,
              },
            },
          },
          _count: {
            select: { versions: true },
          },
        },
      }),
    ]);

    return { total, items };
  }

  /**
   * Find single requirement by ID with full tenant boundary check.
   */
  async findById(requirementId: string, tenant?: TenantContext | undefined) {
    const where: Prisma.RequirementWhereInput = {
      id: requirementId,
      ...(tenant?.organizationId ? { organizationId: tenant.organizationId } : {}),
    };

    return prisma.requirement.findFirst({
      where,
      include: {
        organization: { select: { id: true, name: true } },
        tender: { select: { id: true, title: true, referenceNumber: true } },
        tenderVersion: { select: { id: true, versionNumber: true, status: true } },
        currentVersion: {
          include: {
            sourceDocument: { select: { id: true, fileName: true } },
            createdByUser: { select: { id: true, name: true } },
            approvedByUser: { select: { id: true, name: true } },
            complianceRules: {
              where: { enabled: true },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            sourceDocument: { select: { id: true, fileName: true } },
            createdByUser: { select: { id: true, name: true } },
            approvedByUser: { select: { id: true, name: true } },
            complianceRules: {
              where: { enabled: true },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
        _count: {
          select: { versions: true },
        },
      },
    });
  }

  /**
   * Get version history for a requirement ordered chronologically descending.
   */
  async findVersionHistory(requirementId: string, tenant?: TenantContext | undefined) {
    const req = await this.findById(requirementId, tenant);
    if (!req) {
      throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
    }

    return prisma.requirementVersion.findMany({
      where: { requirementId },
      orderBy: { versionNumber: "desc" },
      include: {
        sourceDocument: { select: { id: true, fileName: true } },
        createdByUser: { select: { id: true, name: true } },
        approvedByUser: { select: { id: true, name: true } },
        complianceRules: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
  }

  /**
   * Create a requirement manually and initialize v1 with PROPOSED status.
   */
  async createRequirement(
    tenderId: string,
    tenderVersionId: string,
    input: {
      identifier: string;
      category: RequirementCategory;
      title: string;
      description: string;
      mandatory?: boolean | undefined;
      condition?: string | null | undefined;
      operator?: RequirementOperator | null | undefined;
      threshold?: Record<string, unknown> | null | undefined;
      expectedValue?: string | null | undefined;
      requiredEvidenceType?: string | null | undefined;
      sourceClause?: string | null | undefined;
      sourcePage?: number | null | undefined;
      sourceText?: string | null | undefined;
      sourceDocumentId?: string | null | undefined;
    },
    tenant?: TenantContext | undefined
  ) {
    return prisma.$transaction(
      async (tx) => {
        const orgId = tenant?.organizationId ?? null;

        const req = await tx.requirement.create({
          data: {
            organizationId: orgId,
            tenderId,
            tenderVersionId,
            identifier: input.identifier,
            category: input.category,
          },
        });

        const ver = await tx.requirementVersion.create({
          data: {
            requirementId: req.id,
            tenderVersionId,
            versionNumber: 1,
            status: RequirementStatus.PROPOSED,
            category: input.category,
            title: input.title,
            description: input.description,
            mandatory: input.mandatory ?? true,
            condition: input.condition ?? null,
            operator: input.operator ?? null,
            threshold: (input.threshold as any) ?? null,
            expectedValue: input.expectedValue ?? null,
            requiredEvidenceType: input.requiredEvidenceType ?? null,
            sourceClause: input.sourceClause ?? null,
            sourcePage: input.sourcePage ?? null,
            sourceText: input.sourceText ?? null,
            sourceDocumentId: input.sourceDocumentId ?? null,
            aiGenerated: false,
            createdBy: tenant?.userId ?? null,
          },
        });

        await tx.requirement.update({
          where: { id: req.id },
          data: { currentVersionId: ver.id },
        });

        return { requirementId: req.id, versionId: ver.id };
      },
      { timeout: 15000 }
    );
  }

  /**
   * Update requirement or create new immutable version if current version is APPROVED.
   * Enforces optimistic concurrency via expectedCurrentVersionId.
   */
  async updateRequirement(
    requirementId: string,
    input: {
      expectedCurrentVersionId: string;
      title?: string;
      description?: string;
      category?: RequirementCategory;
      mandatory?: boolean;
      condition?: string | null;
      operator?: RequirementOperator | null;
      threshold?: Record<string, unknown> | null;
      expectedValue?: string | null;
      requiredEvidenceType?: string | null;
      sourceClause?: string | null;
      sourcePage?: number | null;
      sourceText?: string | null;
    },
    tenant?: TenantContext | undefined
  ) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Acquire row lock for atomic updates
        const locked = await tx.$queryRaw<Array<{ id: string; currentVersionId: string | null; organizationId: string | null }>>`
          SELECT id, "currentVersionId", "organizationId"
          FROM requirements
          WHERE id = ${requirementId}::uuid
          FOR UPDATE
        `;

        if (!locked || locked.length === 0) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        const reqRow = locked[0]!;
        if (tenant?.organizationId && reqRow.organizationId && reqRow.organizationId !== tenant.organizationId) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        // 2. Optimistic concurrency check
        if (reqRow.currentVersionId !== input.expectedCurrentVersionId) {
          throw new ConflictError(
            "Requirement was updated by another user or process. Please refresh to view the latest version."
          );
        }

        // 3. Fetch active version under row lock
        const currentVersion = await tx.requirementVersion.findUniqueOrThrow({
          where: { id: input.expectedCurrentVersionId },
          include: {
            complianceRules: {
              where: { enabled: true },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        });

        // 4. Evidentiary Immutability Invariant:
        // If current version is APPROVED, NEVER mutate in place. Create new version.
        if (currentVersion.status === RequirementStatus.APPROVED) {
          const maxVersionAgg = await tx.requirementVersion.aggregate({
            where: { requirementId },
            _max: { versionNumber: true },
          });
          const nextVersionNumber = (maxVersionAgg._max.versionNumber ?? currentVersion.versionNumber) + 1;

          const newVersion = await tx.requirementVersion.create({
            data: {
              requirementId,
              tenderVersionId: currentVersion.tenderVersionId,
              versionNumber: nextVersionNumber,
              status: RequirementStatus.IN_REVIEW,
              category: input.category ?? currentVersion.category,
              title: input.title ?? currentVersion.title,
              description: input.description ?? currentVersion.description,
              mandatory: input.mandatory !== undefined ? input.mandatory : currentVersion.mandatory,
              condition: input.condition !== undefined ? input.condition : currentVersion.condition,
              operator: input.operator !== undefined ? input.operator : currentVersion.operator,
              threshold: input.threshold !== undefined ? (input.threshold as any) : currentVersion.threshold,
              expectedValue: input.expectedValue !== undefined ? input.expectedValue : currentVersion.expectedValue,
              requiredEvidenceType: input.requiredEvidenceType !== undefined ? input.requiredEvidenceType : currentVersion.requiredEvidenceType,
              sourceClause: input.sourceClause !== undefined ? input.sourceClause : currentVersion.sourceClause,
              sourcePage: input.sourcePage !== undefined ? input.sourcePage : currentVersion.sourcePage,
              sourceText: input.sourceText !== undefined ? input.sourceText : currentVersion.sourceText,
              sourceDocumentId: currentVersion.sourceDocumentId,
              sourceLocation: currentVersion.sourceLocation as any,
              aiGenerated: false,
              createdBy: tenant?.userId ?? null,
              supersedesVersionId: currentVersion.id,
            },
          });

          // Replicate existing compliance rule mapping to the new version if present
          if (currentVersion.complianceRules.length > 0) {
            const prevRule = currentVersion.complianceRules[0]!;
            await tx.complianceRule.create({
              data: {
                requirementId,
                requirementVersionId: newVersion.id,
                ruleType: prevRule.ruleType,
                operator: newVersion.operator ?? prevRule.operator,
                expectedValue: newVersion.expectedValue ?? prevRule.expectedValue,
                parameters: prevRule.parameters as any,
                priority: prevRule.priority,
                enabled: true,
                version: prevRule.version,
              },
            });
          }

          // Atomically update currentVersionId on Requirement
          await tx.requirement.update({
            where: { id: requirementId },
            data: {
              currentVersionId: newVersion.id,
              category: newVersion.category,
              updatedAt: new Date(),
            },
          });

          return { version: newVersion, wasNewVersionCreated: true };
        } else {
          // If current version is PROPOSED or IN_REVIEW, update current draft version
          const updatedVersion = await tx.requirementVersion.update({
            where: { id: currentVersion.id },
            data: {
              status: RequirementStatus.IN_REVIEW,
              ...(input.category ? { category: input.category } : {}),
              ...(input.title !== undefined ? { title: input.title } : {}),
              ...(input.description !== undefined ? { description: input.description } : {}),
              ...(input.mandatory !== undefined ? { mandatory: input.mandatory } : {}),
              ...(input.condition !== undefined ? { condition: input.condition } : {}),
              ...(input.operator !== undefined ? { operator: input.operator } : {}),
              ...(input.threshold !== undefined ? { threshold: input.threshold as any } : {}),
              ...(input.expectedValue !== undefined ? { expectedValue: input.expectedValue } : {}),
              ...(input.requiredEvidenceType !== undefined ? { requiredEvidenceType: input.requiredEvidenceType } : {}),
              ...(input.sourceClause !== undefined ? { sourceClause: input.sourceClause } : {}),
              ...(input.sourcePage !== undefined ? { sourcePage: input.sourcePage } : {}),
              ...(input.sourceText !== undefined ? { sourceText: input.sourceText } : {}),
            },
          });

          await tx.requirement.update({
            where: { id: requirementId },
            data: {
              ...(input.category ? { category: input.category } : {}),
              updatedAt: new Date(),
            },
          });

          return { version: updatedVersion, wasNewVersionCreated: false };
        }
      },
      { timeout: 20000 }
    );
  }

  /**
   * Approve requirement.
   * Strict validation:
   * 1. Optimistic concurrency check.
   * 2. Source clause exists.
   * 3. Source page exists.
   * 4. Rule mapping exists.
   * 5. Approvable state (PROPOSED or IN_REVIEW).
   */
  async approveRequirement(
    requirementId: string,
    expectedCurrentVersionId: string,
    tenant: TenantContext
  ) {
    return prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string; currentVersionId: string | null; organizationId: string | null }>>`
          SELECT id, "currentVersionId", "organizationId"
          FROM requirements
          WHERE id = ${requirementId}::uuid
          FOR UPDATE
        `;

        if (!locked || locked.length === 0) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        const reqRow = locked[0]!;
        if (reqRow.organizationId && reqRow.organizationId !== tenant.organizationId) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        // Concurrency check
        if (reqRow.currentVersionId !== expectedCurrentVersionId) {
          throw new ConflictError(
            "Requirement version conflict. Please refresh to inspect latest updates before approving."
          );
        }

        const version = await tx.requirementVersion.findUniqueOrThrow({
          where: { id: expectedCurrentVersionId },
          include: {
            complianceRules: {
              where: { enabled: true },
            },
          },
        });

        // Approvable state guard
        if (version.status === RequirementStatus.APPROVED) {
          throw new ConflictError("This requirement is already approved.");
        }
        if (version.status === RequirementStatus.REJECTED || version.status === RequirementStatus.SUPERSEDED) {
          throw new ConflictError(`Cannot approve requirement in ${version.status} state. Edit to create a new reviewable version first.`);
        }

        // Provenance Guards (Contract Sections 6 & 19)
        if (!version.sourceClause || version.sourceClause.trim().length === 0) {
          throw new ValidationError("Cannot approve requirement without a source clause reference.", [
            { field: "sourceClause", message: "Source clause reference is mandatory for approval." },
          ]);
        }
        if (!version.sourcePage || version.sourcePage < 1) {
          throw new ValidationError("Cannot approve requirement without a valid source page number.", [
            { field: "sourcePage", message: "Source page must be a positive integer." },
          ]);
        }

        // Rule Mapping Guard (Contract Section 19 & 22)
        if (!version.complianceRules || version.complianceRules.length === 0) {
          throw new ValidationError("Cannot approve requirement without an explicit compliance rule mapping.", [
            { field: "ruleMapping", message: "A valid rule mapping from the controlled catalog is mandatory before approval." },
          ]);
        }

        // Transition to APPROVED
        const approved = await tx.requirementVersion.update({
          where: { id: version.id },
          data: {
            status: RequirementStatus.APPROVED,
            approvedBy: tenant.userId,
            approvedAt: new Date(),
          },
          include: {
            complianceRules: true,
            sourceDocument: { select: { id: true, fileName: true } },
          },
        });

        return approved;
      },
      { timeout: 20000 }
    );
  }

  /**
   * Reject requirement.
   * Captures mandatory rejectionReason and updates status to REJECTED.
   */
  async rejectRequirement(
    requirementId: string,
    expectedCurrentVersionId: string,
    rejectionReason: string,
    tenant: TenantContext
  ) {
    return prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string; currentVersionId: string | null; organizationId: string | null }>>`
          SELECT id, "currentVersionId", "organizationId"
          FROM requirements
          WHERE id = ${requirementId}::uuid
          FOR UPDATE
        `;

        if (!locked || locked.length === 0) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        const reqRow = locked[0]!;
        if (reqRow.organizationId && reqRow.organizationId !== tenant.organizationId) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        if (reqRow.currentVersionId !== expectedCurrentVersionId) {
          throw new ConflictError(
            "Requirement version conflict. Please refresh to inspect latest updates before rejecting."
          );
        }

        const version = await tx.requirementVersion.findUniqueOrThrow({
          where: { id: expectedCurrentVersionId },
        });

        if (version.status === RequirementStatus.REJECTED) {
          throw new ConflictError("This requirement is already rejected.");
        }

        const rejected = await tx.requirementVersion.update({
          where: { id: version.id },
          data: {
            status: RequirementStatus.REJECTED,
            rejectionReason,
          },
        });

        return rejected;
      },
      { timeout: 20000 }
    );
  }

  /**
   * Map requirement to an explicit, controlled compliance rule.
   */
  async mapRule(
    requirementId: string,
    input: {
      expectedCurrentVersionId: string;
      ruleId: string;
      ruleVersion?: number;
      operator?: RequirementOperator | null;
      expectedValue?: string | null;
      parameters?: Record<string, unknown>;
    },
    tenant: TenantContext
  ) {
    if (!isValidRuleId(input.ruleId)) {
      throw new ValidationError(`Unknown rule ID: '${input.ruleId}'. Must belong to controlled catalog.`);
    }

    const catalogItem = getRuleCatalogItem(input.ruleId);

    return prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string; currentVersionId: string | null; organizationId: string | null }>>`
          SELECT id, "currentVersionId", "organizationId"
          FROM requirements
          WHERE id = ${requirementId}::uuid
          FOR UPDATE
        `;

        if (!locked || locked.length === 0) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        const reqRow = locked[0]!;
        if (reqRow.organizationId && reqRow.organizationId !== tenant.organizationId) {
          throw new NotFoundError(`Requirement with ID ${requirementId} not found`);
        }

        if (reqRow.currentVersionId !== input.expectedCurrentVersionId) {
          throw new ConflictError("Requirement version conflict. Please refresh to inspect latest updates.");
        }

        const version = await tx.requirementVersion.findUniqueOrThrow({
          where: { id: input.expectedCurrentVersionId },
        });

        // Upsert ComplianceRule linked to this RequirementVersion
        const existingRule = await tx.complianceRule.findFirst({
          where: { requirementVersionId: version.id },
        });

        let mappedRule;
        if (existingRule) {
          mappedRule = await tx.complianceRule.update({
            where: { id: existingRule.id },
            data: {
              ruleType: input.ruleId,
              version: input.ruleVersion ?? 1,
              operator: input.operator ?? version.operator ?? catalogItem?.supportedOperators[0] ?? null,
              expectedValue: input.expectedValue ?? version.expectedValue ?? null,
              parameters: (input.parameters as any) ?? {},
              enabled: true,
              updatedAt: new Date(),
            },
          });
        } else {
          mappedRule = await tx.complianceRule.create({
            data: {
              requirementId,
              requirementVersionId: version.id,
              ruleType: input.ruleId,
              version: input.ruleVersion ?? 1,
              operator: input.operator ?? version.operator ?? catalogItem?.supportedOperators[0] ?? null,
              expectedValue: input.expectedValue ?? version.expectedValue ?? null,
              parameters: (input.parameters as any) ?? {},
              enabled: true,
            },
          });
        }

        return mappedRule;
      },
      { timeout: 20000 }
    );
  }
}

export const requirementRepository = new RequirementRepository();
