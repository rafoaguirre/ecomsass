/**
 * Cursor-based pagination metadata
 */
export interface CursorPagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Offset-based pagination metadata
 */
export interface OffsetPagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

/**
 * Paginated response with cursor pagination
 */
export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

/**
 * Paginated response with offset pagination
 */
export interface OffsetPaginatedResponse<T> {
  data: T[];
  pagination: OffsetPagination;
}

/**
 * Pagination query parameters for cursor-based
 */
export interface CursorPaginationQuery {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

/**
 * Pagination query parameters for offset-based
 */
export interface OffsetPaginationQuery {
  page?: number;
  pageSize?: number;
}
