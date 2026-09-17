import { prisma } from "../../infrastructure/database/prisma.js";
import type { TenderStatus, TenderVersionStatus, Prisma } from "@prisma/client";
import type { PaginationParams, TenantContext, CreateTenderInput } from "./tender.types.js";

export class TenderRepository {
  /** List tenders with bounded pagination and tenant awareness */
  async findMany(params: PaginationParams, tenant?: TenantContext | undefined) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TenderWhereInput = tenant?.organizationId ? { organizationId: tenant.organizationId } : {};

    const [total, items] = await Promise.all([
      prisma.tender.count({ where }),
      prisma.tender.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              title: true,
              status: true,
              createdAt: true,
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

  /** Find single tender by ID with versions and requirements */
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

  /** Get default demo organization ID if not provided (for Phase 03 unauthenticated demo context) */
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

  /** Create tender with initial TenderVersion v1 in a transaction */
  async createWithInitialVersion(input: CreateTenderInput & { organizationId: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Tender
      const tender = await tx.tender.create({
        data: {
          organizationId: input.organizationId,
          title: input.title,
          referenceNumber: input.referenceNumber,
          status: "DRAFT" as TenderStatus,
        },
      });

      // 2. Create initial TenderVersion 1
      const version = await tx.tenderVersion.create({
        data: {
          tenderId: tender.id,
          versionNumber: 1,
          title: `${input.title} - v1`,
          description: input.description ?? null,
          status: "DRAFT" as TenderVersionStatus,
        },
      });

      // 3. Set currentVersionId on Tender
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
    });
  }
}

export const tenderRepository = new TenderRepository();

