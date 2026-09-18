import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma, type TenderStatus, type TenderVersionStatus } from "@prisma/client";
import type {
  PaginationParams,
  TenantContext,
  CreateTenderInput,
  UpdateTenderInput,
  CreateTenderVersionInput,
  TenderVersionContentPayload,
} from "./tender.types.js";
import { BaseRepository } from "../../shared/database/base.repository.js";
import { NotFoundError, ConflictError } from "../../shared/errors/app-error.js";

export class TenderRepository extends BaseRepository {
  /** List tenders with bounded deterministic pagination, filtering, and tenant awareness */
  async findMany(params: PaginationParams, tenant?: TenantContext | undefined) {
    const { page, pageSize, search, status, category, department, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TenderWhereInput = {
      ...(tenant?.organizationId ? { organizationId: tenant.organizationId } : {}),
      ...(status ? { status: status as TenderStatus } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(department ? { department: { equals: department, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { referenceNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TenderOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      { id: "desc" },
    ];

    const [total, items] = await Promise.all([
      prisma.tender.count({ where }),
      prisma.tender.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              title: true,
              description: true,
              status: true,
              createdAt: true,
              changeSummary: true,
            },
          },
          _count: {
            select: {
              versions: true,
              bids: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  /** Find single tender by ID with versions and requirements, strictly tenant-scoped */
  async findById(id: string, tenant?: TenantContext | undefined) {
    const where: Prisma.TenderWhereInput = tenant?.organizationId
      ? { id, organizationId: tenant.organizationId }
      : { id };

    return prisma.tender.findFirst({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            requirements: {
              include: {
                versions: {
                  orderBy: { versionNumber: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  /** Find tender by reference within an organization */
  async findByReference(referenceNumber: string, organizationId: string) {
    return prisma.tender.findUnique({
      where: {
        organizationId_referenceNumber: {
          organizationId,
          referenceNumber,
        },
      },
    });
  }

  /** Get default demo organization ID if not provided */
  async getDefaultOrganizationId(): Promise<string> {
    const org = await prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!org) {
      throw new Error("No organization found in database. Please run seed first.");
    }
    return org.id;
  }

  /** Create tender with initial TenderVersion v1 in a single atomic transaction */
  async createWithInitialVersion(input: CreateTenderInput & { organizationId: string }) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Create Tender
        const tender = await tx.tender.create({
          data: {
            organizationId: input.organizationId,
            title: input.title,
            referenceNumber: input.referenceNumber,
            category: input.category ?? null,
            department: input.department ?? null,
            status: "DRAFT" as TenderStatus,
          },
        });

        // 2. Build initial version content snapshot
        const versionContent: TenderVersionContentPayload = {
          ...(input.content || {}),
          ...(input.submissionDeadline ? { submissionDeadline: input.submissionDeadline } : {}),
          ...(typeof input.budget === "number" ? { budget: input.budget } : {}),
        };

        // 3. Create initial TenderVersion 1
        const version = await tx.tenderVersion.create({
          data: {
            tenderId: tender.id,
            versionNumber: 1,
            title: `${input.title} - v1`,
            description: input.description ?? null,
            content: Object.keys(versionContent).length > 0 ? (versionContent as Prisma.InputJsonValue) : Prisma.DbNull,
            changeSummary: "Initial version created",
            status: "DRAFT" as TenderVersionStatus,
          },
        });

        // 4. Atomically set currentVersionId on Tender
        const updatedTender = await tx.tender.update({
          where: { id: tender.id },
          data: { currentVersionId: version.id },
          include: {
            versions: {
              take: 1,
            },
          },
        });

        return updatedTender;
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );
  }

  /** Update mutable administrative metadata */
  async updateMetadata(id: string, data: UpdateTenderInput, tenant?: TenantContext | undefined) {
    const where: Prisma.TenderWhereInput = tenant?.organizationId
      ? { id, organizationId: tenant.organizationId }
      : { id };

    const existing = await prisma.tender.findFirst({ where });
    if (!existing) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    return prisma.tender.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.department !== undefined ? { department: data.department } : {}),
      },
    });
  }

  /** Update tender lifecycle status and synchronize active version status */
  async updateStatus(id: string, newStatus: TenderStatus, tenant?: TenantContext | undefined) {
    const where: Prisma.TenderWhereInput = tenant?.organizationId
      ? { id, organizationId: tenant.organizationId }
      : { id };

    const existing = await prisma.tender.findFirst({ where });
    if (!existing) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedTender = await tx.tender.update({
        where: { id },
        data: { status: newStatus },
      });

      // If tender transitions to PUBLISHED, mark currentVersion as PUBLISHED if it is DRAFT
      if (newStatus === "PUBLISHED" && existing.currentVersionId) {
        await tx.tenderVersion.updateMany({
          where: {
            id: existing.currentVersionId,
            status: "DRAFT",
          },
          data: { status: "PUBLISHED" },
        });
      }

      return updatedTender;
    });
  }

  /** List all historical versions for a tender in deterministic order */
  async listVersions(tenderId: string, tenant?: TenantContext | undefined) {
    const tenderWhere: Prisma.TenderWhereInput = tenant?.organizationId
      ? { id: tenderId, organizationId: tenant.organizationId }
      : { id: tenderId };

    const tender = await prisma.tender.findFirst({
      where: tenderWhere,
      select: { id: true, currentVersionId: true },
    });

    if (!tender) {
      throw new NotFoundError(`Tender with ID ${tenderId} was not found`);
    }

    const versions = await prisma.tenderVersion.findMany({
      where: { tenderId },
      orderBy: [{ versionNumber: "desc" }, { id: "desc" }],
      include: {
        requirements: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    return {
      currentVersionId: tender.currentVersionId,
      versions,
    };
  }

  /** Find a specific historical version by ID ensuring it belongs to requested tender and tenant */
  async findVersionById(tenderId: string, versionId: string, tenant?: TenantContext | undefined) {
    const tenderWhere: Prisma.TenderWhereInput = tenant?.organizationId
      ? { id: tenderId, organizationId: tenant.organizationId }
      : { id: tenderId };

    const tender = await prisma.tender.findFirst({
      where: tenderWhere,
      select: { id: true, currentVersionId: true },
    });

    if (!tender) {
      throw new NotFoundError(`Tender with ID ${tenderId} was not found`);
    }

    const version = await prisma.tenderVersion.findFirst({
      where: {
        id: versionId,
        tenderId,
      },
      include: {
        requirements: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundError(`Tender version ${versionId} was not found for this tender`);
    }

    return {
      isCurrent: version.id === tender.currentVersionId,
      version,
    };
  }

  /**
   * Create new TenderVersion with row locking, atomic currentVersionId update,
   * deterministic version numbering, and optimistic concurrency check.
   */
  async createVersion(
    tenderId: string,
    input: CreateTenderVersionInput,
    tenant?: TenantContext | undefined
  ) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Acquire row lock on the Tender to serialize concurrent version creation
        if (tenant?.organizationId) {
          const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM tenders 
            WHERE id = ${tenderId}::uuid AND "organizationId" = ${tenant.organizationId}::uuid 
            FOR UPDATE
          `;
          if (!lockedRows || lockedRows.length === 0) {
            throw new NotFoundError(`Tender with ID ${tenderId} was not found`);
          }
        } else {
          const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM tenders 
            WHERE id = ${tenderId}::uuid 
            FOR UPDATE
          `;
          if (!lockedRows || lockedRows.length === 0) {
            throw new NotFoundError(`Tender with ID ${tenderId} was not found`);
          }
        }

        // 2. Fetch fresh tender state under row lock
        const tender = await tx.tender.findUniqueOrThrow({
          where: { id: tenderId },
        });

        // 3. Optimistic concurrency check if caller provided expected current version
        if (
          input.expectedCurrentVersionId &&
          tender.currentVersionId !== input.expectedCurrentVersionId
        ) {
          throw new ConflictError(
            "This tender was updated by another user or process. Refresh to review the latest version."
          );
        }

        // 4. Query current highest version number
        const latestVersion = await tx.tenderVersion.findFirst({
          where: { tenderId },
          orderBy: { versionNumber: "desc" },
        });

        const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

        // 5. Build immutable version content snapshot
        const previousContent =
          latestVersion?.content && typeof latestVersion.content === "object"
            ? (latestVersion.content as Record<string, unknown>)
            : {};

        const versionContent: TenderVersionContentPayload = {
          ...previousContent,
          ...(input.content || {}),
          ...(input.submissionDeadline ? { submissionDeadline: input.submissionDeadline } : {}),
          ...(typeof input.budget === "number" ? { budget: input.budget } : {}),
        };

        // 6. Determine version status
        let newVersionStatus: TenderVersionStatus = "DRAFT";
        if (input.status === "PUBLISHED" || tender.status === "PUBLISHED") {
          newVersionStatus = "PUBLISHED";
          // Mark previous active version as SUPERSEDED
          if (tender.currentVersionId) {
            await tx.tenderVersion.updateMany({
              where: {
                id: tender.currentVersionId,
                status: "PUBLISHED",
              },
              data: { status: "SUPERSEDED" },
            });
          }
        }

        // 7. Create new TenderVersion
        const createdVersion = await tx.tenderVersion.create({
          data: {
            tenderId: tender.id,
            versionNumber: nextVersionNumber,
            title: input.title || `${tender.title} - v${nextVersionNumber}`,
            description: input.description ?? latestVersion?.description ?? null,
            changeSummary: input.changeSummary ?? `Version ${nextVersionNumber} created`,
            content:
              Object.keys(versionContent).length > 0
                ? (versionContent as Prisma.InputJsonValue)
                : Prisma.DbNull,
            status: newVersionStatus,
          },
        });

        // 8. Atomically update Tender currentVersionId and updatedAt
        const updatedTender = await tx.tender.update({
          where: { id: tender.id },
          data: {
            currentVersionId: createdVersion.id,
            updatedAt: new Date(),
          },
        });

        return {
          tender: updatedTender,
          version: createdVersion,
        };
      },
      {
        timeout: 20000,
        maxWait: 10000,
      }
    );
  }
}

export const tenderRepository = new TenderRepository();
