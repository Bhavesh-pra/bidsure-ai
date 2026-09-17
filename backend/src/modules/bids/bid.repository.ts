import { prisma } from "../../infrastructure/database/prisma.js";
import type { Prisma } from "@prisma/client";
import type { PaginationParams, TenantContext } from "./bid.types.js";

export class BidRepository {
  /** List bids with bounded pagination and relations */
  async findMany(
    params: PaginationParams & { tenderId?: string | undefined },
    tenant?: TenantContext | undefined
  ) {
    const { page, pageSize, tenderId } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BidWhereInput = {};

    if (tenant?.organizationId) {
      where.organizationId = tenant.organizationId;
    }
    if (tenderId) {
      where.tenderId = tenderId;
    }

    const [total, items] = await Promise.all([
      prisma.bid.count({ where }),
      prisma.bid.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          bidder: {
            select: {
              id: true,
              legalName: true,
              tradeName: true,
              contactEmail: true,
            },
          },
          tender: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
            },
          },
          tenderVersion: {
            select: {
              id: true,
              versionNumber: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  /** Find single bid by ID with full relations */
  async findById(id: string, tenant?: TenantContext) {
    const where = tenant?.organizationId
      ? { id, organizationId: tenant.organizationId }
      : { id };

    return prisma.bid.findFirst({
      where,
      include: {
        bidder: true,
        tender: {
          select: {
            id: true,
            title: true,
            referenceNumber: true,
            status: true,
          },
        },
        tenderVersion: {
          select: {
            id: true,
            versionNumber: true,
            title: true,
            status: true,
          },
        },
        bidDocuments: {
          include: {
            document: true,
          },
        },
      },
    });
  }
}

export const bidRepository = new BidRepository();

