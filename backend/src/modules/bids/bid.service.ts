import { bidRepository, BidRepository } from "./bid.repository.js";
import { NotFoundError } from "../../shared/errors/app-error.js";
import type { PaginationParams, TenantContext, BidDTO } from "./bid.types.js";

export class BidService {
  constructor(private readonly repository: BidRepository = bidRepository) {}

  /** List bids with pagination */
  async listBids(
    params: PaginationParams & { tenderId?: string | undefined },
    tenant?: TenantContext | undefined
  ) {
    const { total, items } = await this.repository.findMany(params, tenant);
    const totalPages = Math.ceil(total / params.pageSize) || 0;

    const formatted: BidDTO[] = items.map((b) => ({
      id: b.id,
      organizationId: b.organizationId,
      tenderId: b.tenderId,
      tenderVersionId: b.tenderVersionId,
      bidderId: b.bidderId,
      bidReference: b.bidReference,
      status: b.status,
      totalAmount: b.totalAmount ? Number(b.totalAmount) : null,
      currency: b.currency,
      submittedAt: b.submittedAt ? b.submittedAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      bidder: b.bidder,
      tender: b.tender,
      tenderVersion: b.tenderVersion,
    }));

    return {
      items: formatted,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
      },
    };
  }

  /** Get single bid by ID */
  async getBidById(id: string, tenant?: TenantContext): Promise<BidDTO> {
    const bid = await this.repository.findById(id, tenant);
    if (!bid) {
      throw new NotFoundError(`Bid with ID ${id} was not found`);
    }

    return {
      id: bid.id,
      organizationId: bid.organizationId,
      tenderId: bid.tenderId,
      tenderVersionId: bid.tenderVersionId,
      bidderId: bid.bidderId,
      bidReference: bid.bidReference,
      status: bid.status,
      totalAmount: bid.totalAmount ? Number(bid.totalAmount) : null,
      currency: bid.currency,
      submittedAt: bid.submittedAt ? bid.submittedAt.toISOString() : null,
      createdAt: bid.createdAt.toISOString(),
      updatedAt: bid.updatedAt.toISOString(),
      bidder: {
        id: bid.bidder.id,
        legalName: bid.bidder.legalName,
        tradeName: bid.bidder.tradeName,
        contactEmail: bid.bidder.contactEmail,
      },
      tender: {
        id: bid.tender.id,
        title: bid.tender.title,
        referenceNumber: bid.tender.referenceNumber,
      },
      tenderVersion: {
        id: bid.tenderVersion.id,
        versionNumber: bid.tenderVersion.versionNumber,
        title: bid.tenderVersion.title,
      },
      documents: bid.bidDocuments.map((bd) => ({
        id: bd.id,
        category: bd.category,
        required: bd.required,
        document: {
          id: bd.document.id,
          fileName: bd.document.fileName,
          mimeType: bd.document.mimeType,
          fileSize: bd.document.fileSize,
          processingStatus: bd.document.processingStatus,
          createdAt: bd.document.createdAt.toISOString(),
        },
      })),
    };
  }
}

export const bidService = new BidService();

