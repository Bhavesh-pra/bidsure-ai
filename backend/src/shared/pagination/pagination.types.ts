import type { PaginationMeta, CollectionMeta } from "../types/api.types.js";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  meta: CollectionMeta;
}

export type { PaginationMeta, CollectionMeta };
