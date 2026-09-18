import { bidRepository, BidRepository } from "./bid.repository.js";
import {
  BidNotFoundError,
  BidNotEditableError,
  BidInvalidStateTransitionError,
  BidTenderVersionMismatchError,
  BidTenderVersionInvalidError,
  BidAlreadyExistsError,
  BidderImpersonationError,
  CrossTenantAccessDeniedError,
  BidConcurrencyConflictError,
  BidSubmissionNotAllowedError,
} from "./bid.errors.js";
import { assertValidBidTransition, isEditableBidStatus } from "./bid.state-machine.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { runInTransaction } from "../../shared/database/transaction.helper.js";
import { logger } from "../../infrastructure/logging/logger.js";
import { can } from "../../shared/auth/permissions.js";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "../../shared/errors/app-error.js";
import { BidStatus, TenderStatus, TenderVersionStatus } from "@prisma/client";
import type {
  BidFilterParams,
  TenantContext,
  BidDTO,
  CreateBidInput,
  UpdateDraftBidInput,
} from "./bid.types.js";
import { buildCollectionMeta } from "../../shared/pagination/pagination.helper.js";

export class BidService {
  constructor(private readonly repository: BidRepository = bidRepository) {}

  /** List bids with bounded pagination, deterministic ordering, and tenant isolation */
  async listBids(
    params: BidFilterParams,
    tenant?: TenantContext | undefined
  ) {
    this.assertAuthorized(tenant, "read");

    const { total, items } = await this.repository.findMany(params, tenant);

    const formatted: BidDTO[] = items.map((b) => this.formatBidDTO(b));

    return {
      items: formatted,
      meta: buildCollectionMeta(total, params.page, params.pageSize),
    };
  }

  /** Get single bid by ID strictly scoped to actor's tenant and role */
  async getBidById(id: string, tenant?: TenantContext): Promise<BidDTO> {
    this.assertAuthorized(tenant, "read");

    const bid = await this.repository.findById(id, tenant);
    if (!bid) {
      throw new BidNotFoundError(id);
    }

    return this.formatBidDTO(bid);
  }

  /**
   * Phase 07 Create Bid:
   * Creates a new Bid strictly in DRAFT state bound to an exact TenderVersion.
   */
  async createBid(input: CreateBidInput, tenant?: TenantContext): Promise<BidDTO> {
    this.assertAuthorized(tenant, "create");

    if (!tenant?.organizationId || !tenant.userId) {
      throw new UnauthorizedError("Authoritative tenant context is required to create a bid");
    }

    if (tenant.role !== "BIDDER" || !tenant.bidderId) {
      throw new ForbiddenError("Only registered bidders may create tender proposals");
    }

    const bidderId = tenant.bidderId;

    // Defense against Bidder Impersonation: cannot create on behalf of another entity
    if (input.bidderId && input.bidderId !== bidderId) {
      throw new BidderImpersonationError(input.bidderId, bidderId);
    }

    // 1. Verify Target Tender exists and enforce Cross-Tenant Isolation (Test B)
    const tender = await prisma.tender.findUnique({
      where: { id: input.tenderId },
      select: { id: true, organizationId: true, status: true, referenceNumber: true },
    });

    if (!tender) {
      throw new NotFoundError(`Tender with ID ${input.tenderId} was not found`);
    }

    // Cross-tenant bid creation must be strictly denied
    if (tender.organizationId !== tenant.organizationId) {
      throw new CrossTenantAccessDeniedError(
        `Cross-tenant violation: Cannot create a bid for a tender belonging to organization ${tender.organizationId}`
      );
    }

    // Target Tender must be PUBLISHED for bid creation
    if (tender.status !== TenderStatus.PUBLISHED) {
      throw new BidSubmissionNotAllowedError(
        `Cannot create proposal: Tender ${tender.referenceNumber} is in '${tender.status}' state and is not open for bidding.`
      );
    }

    // 2. Validate exact TenderVersion binding and cross-tender invariant
    await this.validateBidTenderVersionBelongsToTender(
      input.tenderId,
      input.tenderVersionId,
      tenant
    );

    // 3. Verify Bidder does not already have an active bid for this tender (One Bid per Tender rule)
    const existingBid = await this.repository.findByTenderAndBidder(input.tenderId, bidderId);
    if (existingBid) {
      throw new BidAlreadyExistsError(input.tenderId, bidderId);
    }

    // Fetch Bidder info for reference hint
    const bidder = await prisma.bidder.findUnique({
      where: { id: bidderId },
      select: { legalName: true, tradeName: true },
    });

    const refHint = bidder?.tradeName || bidder?.legalName || "PROP";
    const bidReference = await this.repository.generateBidReference(tenant.organizationId, refHint);

    // 4. Persist Bid in DRAFT state
    const created = await this.repository.create({
      organizationId: tenant.organizationId,
      tenderId: input.tenderId,
      tenderVersionId: input.tenderVersionId,
      bidderId,
      bidReference,
      totalAmount: input.totalAmount,
      currency: input.currency || "INR",
      metadata: input.metadata || null,
    });

    logger.info(
      {
        event: "BID_CREATED",
        bidId: created.id,
        bidReference: created.bidReference,
        tenderId: created.tenderId,
        tenderVersionId: created.tenderVersionId,
        bidderId: created.bidderId,
        organizationId: created.organizationId,
        actorId: tenant.userId,
      },
      "New procurement bid created in DRAFT state"
    );

    return this.formatBidDTO(created);
  }

  /**
   * Phase 07 Update Draft Bid:
   * Only permits editing mutable proposal fields when Bid is in DRAFT state.
   */
  async updateDraftBid(
    id: string,
    input: UpdateDraftBidInput,
    tenant?: TenantContext
  ): Promise<BidDTO> {
    this.assertAuthorized(tenant, "update");

    const bid = await this.repository.findById(id, tenant);
    if (!bid) {
      throw new BidNotFoundError(id);
    }

    // Bidder ownership validation
    if (tenant?.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
      throw new BidderImpersonationError(bid.bidderId, tenant.bidderId);
    }

    // INVARIANT: Only DRAFT bids may be edited
    if (!isEditableBidStatus(bid.status as BidStatus)) {
      throw new BidNotEditableError(
        bid.status,
        `Cannot update bid ${bid.bidReference}: Proposal is in '${bid.status}' state and is locked against modifications.`
      );
    }

    // Optimistic Concurrency Check
    if (input.expectedVersion !== undefined && bid.version !== input.expectedVersion) {
      throw new BidConcurrencyConflictError(input.expectedVersion, bid.version);
    }

    const updated = await this.repository.updateDraft(id, input);

    logger.info(
      {
        event: "BID_UPDATED",
        bidId: id,
        newVersion: updated.version,
        organizationId: bid.organizationId,
        actorId: tenant?.userId,
      },
      "Draft bid metadata updated"
    );

    return this.formatBidDTO(updated);
  }

  /**
   * Phase 07 Submit Bid:
   * Explicit, atomic state transition from DRAFT to SUBMITTED.
   * Locked with database transaction to prevent concurrent duplicate submissions.
   */
  async submitBid(id: string, tenant?: TenantContext): Promise<BidDTO> {
    this.assertAuthorized(tenant, "submit");

    return runInTransaction(async (tx) => {
      // 1. Fetch bid within transaction with row lock / fresh state
      const bid = await tx.bid.findUnique({
        where: { id },
        include: {
          bidder: true,
          tender: true,
          tenderVersion: true,
          bidDocuments: { include: { document: true } },
        },
      });

      if (!bid) {
        throw new BidNotFoundError(id);
      }

      // Tenant isolation
      if (tenant?.organizationId && bid.organizationId !== tenant.organizationId) {
        throw new CrossTenantAccessDeniedError("Cannot submit bid belonging to a different organization");
      }

      // Bidder ownership
      if (tenant?.role === "BIDDER" && tenant.bidderId && bid.bidderId !== tenant.bidderId) {
        throw new BidderImpersonationError(bid.bidderId, tenant.bidderId);
      }

      // 2. Validate state machine transition (DRAFT -> SUBMITTED)
      assertValidBidTransition(bid.status as BidStatus, BidStatus.SUBMITTED);

      // 3. Verify target tender is still PUBLISHED
      if (bid.tender.status !== TenderStatus.PUBLISHED) {
        throw new BidSubmissionNotAllowedError(
          `Cannot submit bid: Tender ${bid.tender.referenceNumber} is in '${bid.tender.status}' state.`
        );
      }

      // 4. Perform atomic transition to SUBMITTED
      const updateResult = await tx.bid.updateMany({
        where: { id, status: BidStatus.DRAFT },
        data: {
          status: BidStatus.SUBMITTED,
          submittedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        // Race condition: bid was already transitioned concurrently
        const current = await tx.bid.findUnique({
          where: { id },
          select: { status: true },
        });
        if (!current) {
          throw new BidNotFoundError(id);
        }
        throw new BidInvalidStateTransitionError(current.status as BidStatus, BidStatus.SUBMITTED);
      }

      const submitted = await tx.bid.findUniqueOrThrow({
        where: { id },
        include: {
          bidder: true,
          tender: true,
          tenderVersion: true,
          bidDocuments: { include: { document: true } },
        },
      });

      logger.info(
        {
          event: "BID_SUBMITTED",
          bidId: submitted.id,
          bidReference: submitted.bidReference,
          tenderId: submitted.tenderId,
          tenderVersionId: submitted.tenderVersionId,
          versionNumber: submitted.tenderVersion.versionNumber,
          bidderId: submitted.bidderId,
          organizationId: submitted.organizationId,
          actorId: tenant?.userId,
          submittedAt: submitted.submittedAt,
        },
        `Bid ${submitted.bidReference} successfully submitted against TenderVersion v${submitted.tenderVersion.versionNumber}`
      );

      return this.formatBidDTO(submitted);
    });
  }

  /**
   * Phase 07 Invariant Enforcement:
   * Bid.tenderVersionId MUST belong to Bid.tenderId.
   */
  async validateBidTenderVersionBelongsToTender(
    tenderId: string,
    tenderVersionId: string,
    tenant?: TenantContext
  ): Promise<{ tenderId: string; tenderVersionId: string; versionNumber: number }> {
    const tenderWhere = tenant?.organizationId
      ? { id: tenderId, organizationId: tenant.organizationId }
      : { id: tenderId };

    const tender = await prisma.tender.findFirst({
      where: tenderWhere,
      select: { id: true, status: true, currentVersionId: true },
    });

    if (!tender) {
      throw new NotFoundError(`Tender with ID ${tenderId} was not found`);
    }

    const version = await prisma.tenderVersion.findUnique({
      where: { id: tenderVersionId },
      select: { id: true, tenderId: true, versionNumber: true, status: true },
    });

    if (!version) {
      throw new NotFoundError(`Tender version with ID ${tenderVersionId} was not found`);
    }

    if (version.tenderId !== tenderId) {
      throw new BidTenderVersionMismatchError(tenderId, tenderVersionId, version.tenderId);
    }

    return {
      tenderId: tender.id,
      tenderVersionId: version.id,
      versionNumber: version.versionNumber,
    };
  }

  /** Helper to format Prisma Bid record into authoritative BidDTO */
  private formatBidDTO(bid: any): BidDTO {
    return {
      id: bid.id,
      organizationId: bid.organizationId,
      tenderId: bid.tenderId,
      tenderVersionId: bid.tenderVersionId,
      bidderId: bid.bidderId,
      bidReference: bid.bidReference,
      status: bid.status,
      version: bid.version ?? 1,
      totalAmount: bid.totalAmount ? Number(bid.totalAmount) : null,
      currency: bid.currency,
      metadata: (bid.metadata as Record<string, unknown> | null) ?? null,
      submittedAt: bid.submittedAt ? new Date(bid.submittedAt).toISOString() : null,
      createdAt: new Date(bid.createdAt).toISOString(),
      updatedAt: new Date(bid.updatedAt).toISOString(),
      bidder: bid.bidder
        ? {
            id: bid.bidder.id,
            legalName: bid.bidder.legalName,
            tradeName: bid.bidder.tradeName,
            contactEmail: bid.bidder.contactEmail,
            contactPhone: bid.bidder.contactPhone,
          }
        : undefined,
      tender: bid.tender
        ? {
            id: bid.tender.id,
            title: bid.tender.title,
            referenceNumber: bid.tender.referenceNumber,
            status: bid.tender.status,
          }
        : undefined,
      tenderVersion: bid.tenderVersion
        ? {
            id: bid.tenderVersion.id,
            versionNumber: bid.tenderVersion.versionNumber,
            title: bid.tenderVersion.title,
            status: bid.tenderVersion.status,
          }
        : undefined,
      documents: bid.bidDocuments?.map((bd: any) => ({
        id: bd.id,
        category: bd.category,
        required: bd.required,
        document: {
          id: bd.document.id,
          fileName: bd.document.fileName,
          mimeType: bd.document.mimeType,
          fileSize: bd.document.fileSize,
          processingStatus: bd.document.processingStatus,
          createdAt: new Date(bd.document.createdAt).toISOString(),
        },
      })),
    };
  }

  /** Assert actor authorization */
  private assertAuthorized(
    tenant: TenantContext | undefined,
    action: "read" | "create" | "update" | "submit"
  ) {
    if (!tenant) {
      throw new UnauthorizedError("Authentication is required");
    }

    const dummyUser = {
      id: tenant.userId,
      organizationId: tenant.organizationId,
      email: tenant.email || "user@bidsure.test",
      role: tenant.role,
      name: "",
      status: "ACTIVE" as const,
      bidderId: tenant.bidderId || null,
      organization: {
        id: tenant.organizationId,
        name: "",
        status: "ACTIVE" as const,
      },
    };

    const allowed = can(dummyUser, action, "bid");
    if (!allowed) {
      throw new ForbiddenError(`You do not have permission to ${action} bid proposals`);
    }
  }
}

export const bidService = new BidService();
