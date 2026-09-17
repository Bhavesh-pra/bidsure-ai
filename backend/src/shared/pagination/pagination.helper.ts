import type { PaginationMeta, CollectionMeta, PaginationParams } from "./pagination.types.js";

/**
 * Calculates standard pagination metadata.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const safeTotal = Math.max(0, total);
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(safeTotal / safePageSize);
  const hasNext = safePage < totalPages;
  const hasPrev = safePage > 1;

  return {
    page: safePage,
    pageSize: safePageSize,
    total: safeTotal,
    totalPages,
    hasNextPage: hasNext,
    hasPreviousPage: hasPrev,
    hasNext,
    hasPrev,
  };
}

/**
 * Creates full CollectionMeta envelope containing both meta.pagination
 * and top-level pagination properties for backward compatibility.
 */
export function buildCollectionMeta(
  total: number,
  page: number,
  pageSize: number,
  extraMeta?: Record<string, unknown>
): CollectionMeta {
  const pagination = buildPaginationMeta(total, page, pageSize);
  return {
    ...pagination,
    timestamp: new Date().toISOString(),
    ...extraMeta,
    pagination,
  };
}

/**
 * Maps pagination params into Prisma skip / take options.
 */
export function toPrismaPagination(params: PaginationParams): { skip: number; take: number } {
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, params.pageSize);
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
