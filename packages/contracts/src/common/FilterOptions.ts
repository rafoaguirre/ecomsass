/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

/**
 * Date range filter
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Generic filter options
 */
export interface FilterOptions {
  search?: string;
  sort?: SortOption[];
  dateRange?: DateRange;
  filters?: Record<string, unknown>;
}
