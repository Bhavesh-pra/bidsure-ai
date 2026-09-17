import { tenderRepository, TenderRepository } from "./tender.repository.js";
import { NotFoundError, ConflictError } from "../../shared/errors/app-error.js";
import type { PaginationParams, TenantContext, CreateTenderInput, TenderDTO } from "./tender.types.js";

export class TenderService {
  constructor(private readonly repository: TenderRepository = tenderRepository) {}

  /** Retrieve paginated list of tenders */
  async listTenders(params: PaginationParams, tenant?: TenantContext) {
    const { total, items } = await this.repository.findMany(params, tenant);
    const totalPages = Math.ceil(total / params.pageSize) || 0;

    const formatted: TenderDTO[] = items.map((t) => {
      const latestVersion = t.versions[0];
      return {
        id: t.id,
        organizationId: t.organizationId,
        title: t.title,
        referenceNumber: t.referenceNumber,
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
              description: null,
              content: null,
              status: latestVersion.status,
              createdAt: latestVersion.createdAt.toISOString(),
            }
          : null,
        versionsCount: t._count.versions,
      };
    });

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

  /** Retrieve single tender by ID */
  async getTenderById(id: string, tenant?: TenantContext): Promise<TenderDTO> {
    const tender = await this.repository.findById(id, tenant);
    if (!tender) {
      throw new NotFoundError(`Tender with ID ${id} was not found`);
    }

    const latestVersion = tender.versions[0];

    return {
      id: tender.id,
      organizationId: tender.organizationId,
      title: tender.title,
      referenceNumber: tender.referenceNumber,
      status: tender.status,
      currentVersionId: tender.currentVersionId,
      createdAt: tender.createdAt.toISOString(),
      updatedAt: tender.updatedAt.toISOString(),
      currentVersion: latestVersion
        ? {
            id: latestVersion.id,
            tenderId: tender.id,
            versionNumber: latestVersion.versionNumber,
            title: latestVersion.title,
            description: latestVersion.description,
            content: latestVersion.content,
            status: latestVersion.status,
            createdAt: latestVersion.createdAt.toISOString(),
            requirements: latestVersion.requirements.map((r) => {
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

  /** Create new tender with initial version */
  async createTender(input: CreateTenderInput, tenant?: TenantContext): Promise<TenderDTO> {
    // Resolve organization ID: use tenant context if present, input, or default demo org
    const orgId =
      tenant?.organizationId || input.organizationId || (await this.repository.getDefaultOrganizationId());

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

    return this.getTenderById(created.id, tenant);
  }
}

export const tenderService = new TenderService();

