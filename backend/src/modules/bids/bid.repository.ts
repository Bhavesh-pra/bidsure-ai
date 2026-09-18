import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma, BidStatus } from "@prisma/client";
import type { BidFilterParams, TenantContext, CreateBidInput, UpdateDraftBidInput } from "./bid.types.js";
import { BaseRepository } from "../../shared/database/base.repository.js";

export class BidRepository extends BaseRepository {
  /** List bids with bounded pagination and tenant awareness */
  async findMany(
    params: BidFilterParams,
    tenant?: TenantContext | undefined
  ) {
    const { page, pageSize, tenderId, status } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BidWhereInput = {};

    if (tenant?.organizationId) {
      where.organizationId = tenant.organizationId;
    }
    if (tenderId) {
      where.tenderId = tenderId;
    }
    if (status) {
      where.status = status;
    }
    // Bidder isolation: Bidder only sees their own bids
    if (tenant?.role === "BIDDER" && tenant.bidderId) {
      where.bidderId = tenant.bidderId;
    }

    const [total, items] = await Promise.all([
      prisma.bid.count({ where }),
      prisma.bid.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        include: {
          bidder: {
            select: {
              id: true,
              legalName: true,
              tradeName: true,
              contactEmail: true,
              contactPhone: true,
            },
          },
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
        },
      }),
    ]);

    return { total, items };
  }

  /** Find single bid by ID with full relations */
  async findById(id: string, tenant?: TenantContext) {
    const where: Prisma.BidWhereInput = tenant?.organizationId
      ? { id, organizationId: tenant.organizationId }
      : { id };

    // Bidder isolation: Bidder only accesses their own bids
    if (tenant?.role === "BIDDER" && tenant.bidderId) {
      where.bidderId = tenant.bidderId;
    }

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

  /** Find bid by tender ID and bidder ID to check duplicates */
  async findByTenderAndBidder(tenderId: string, bidderId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma;
    return db.bid.findUnique({
      where: {
        tenderId_bidderId: {
          tenderId,
          bidderId,
        },
      },
    });
  }

  /** Generate deterministic or sequence-based unique Bid Reference */
  async generateBidReference(organizationId: string, entityHint = "PROPOSAL"): Promise<string> {
    const count = await prisma.bid.count({
      where: { organizationId },
    });
    const year = new Date().getFullYear();
    const cleanHint = entityHint.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "VEND";
    const seq = String(count + 1).padStart(3, "0");
    return `BID-${year}-${cleanHint}-${seq}`;
  }

  /** Create new Bid in DRAFT state */
  async create(
    data: {
      organizationId: string;
      tenderId: string;
      tenderVersionId: string;
      bidderId: string;
      bidReference: string;
      totalAmount?: number | null | undefined;
      currency?: string | undefined;
      metadata?: Record<string, unknown> | null | undefined;
    },
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.bid.create({
      data: {
        organizationId: data.organizationId,
        tenderId: data.tenderId,
        tenderVersionId: data.tenderVersionId,
        bidderId: data.bidderId,
        bidReference: data.bidReference,
        status: BidStatus.DRAFT,
        version: 1,
        totalAmount: data.totalAmount !== undefined && data.totalAmount !== null
          ? new Prisma.Decimal(data.totalAmount)
          : null,
        currency: data.currency ?? "INR",
        metadata: data.metadata !== undefined && data.metadata !== null
          ? (data.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
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
      },
    });
  }

  /** Update draft proposal fields with optimistic concurrency check */
  async updateDraft(
    id: string,
    data: UpdateDraftBidInput,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    const updateData: Prisma.BidUpdateInput = {
      version: { increment: 1 },
    };

    if (data.totalAmount !== undefined) {
      updateData.totalAmount = data.totalAmount !== null ? new Prisma.Decimal(data.totalAmount) : null;
    }
    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata !== null ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull;
    }

    const where: Prisma.BidWhereUniqueInput = { id };
    if (data.expectedVersion !== undefined) {
      return db.bid.update({
        where: { id, version: data.expectedVersion },
        data: updateData,
        include: {
          bidder: true,
          tender: true,
          tenderVersion: true,
          bidDocuments: { include: { document: true } },
        },
      });
    }

    return db.bid.update({
      where,
      data: updateData,
      include: {
        bidder: true,
        tender: true,
        tenderVersion: true,
        bidDocuments: { include: { document: true } },
      },
    });
  }

  /** Submit bid transition atomically */
  async submit(
    id: string,
    targetStatus: BidStatus = BidStatus.SUBMITTED,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.bid.update({
      where: { id },
      data: {
        status: targetStatus,
        submittedAt: new Date(),
        version: { increment: 1 },
      },
      include: {
        bidder: true,
        tender: true,
        tenderVersion: true,
        bidDocuments: { include: { document: true } },
      },
    });
  }
}

export const bidRepository = new BidRepository();
