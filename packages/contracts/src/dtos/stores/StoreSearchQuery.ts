import type { StoreType } from '@ecomsaas/domain/enums';
import type { SortDirection } from '../../common/FilterOptions';
import type { StoreSummary } from './StoreResponse';

export interface StoreSearchQuery {
  q?: string;
  storeType?: StoreType;
  sortBy?: 'name' | 'createdAt';
  sortDirection?: SortDirection;
  offset?: number;
  limit?: number;
}

export interface StoreListResponse {
  stores: StoreSummary[];
  totalCount: number;
  hasMore: boolean;
}
