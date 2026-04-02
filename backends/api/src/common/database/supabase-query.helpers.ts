import type { SupabaseClient } from '@ecomsaas/infrastructure/database';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  ascending?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Safely coerce an unknown value to a plain record, returning `{}` for
 * non-object / array / null inputs.  Useful for mapping JSONB columns.
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function clampPageSize(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}

export function clampOffset(offset?: number): number {
  if (!offset || offset < 0) return 0;
  return offset;
}

/**
 * Apply offset-based pagination to a Supabase query builder.
 *
 * Returns the builder with `.range()` applied plus the normalized
 * offset and limit values for constructing `PaginatedResult`.
 */
export function applyPagination<T extends ReturnType<ReturnType<SupabaseClient['from']>['select']>>(
  query: T,
  options: PaginationOptions
): { query: T; offset: number; limit: number } {
  const offset = clampOffset(options.offset);
  const limit = clampPageSize(options.limit);

  return {
    query: query.range(offset, offset + limit - 1) as T,
    offset,
    limit,
  };
}

/**
 * Apply sorting to a Supabase query builder.
 */
export function applySort<T extends ReturnType<ReturnType<SupabaseClient['from']>['select']>>(
  query: T,
  sort: SortOptions
): T {
  return query.order(sort.field, { ascending: sort.ascending ?? true }) as T;
}

/**
 * Build a PaginatedResult from query results and count.
 */
export function toPaginatedResult<T>(
  data: T[],
  total: number,
  offset: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}
