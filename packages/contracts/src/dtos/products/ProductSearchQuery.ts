import type { ProductAvailability } from '@ecomsaas/domain/enums';
import type { SortDirection } from '../../common/FilterOptions';
import type { ProductSummary } from './ProductResponse';

export interface ProductSearchQuery {
  q?: string;
  storeId?: string;
  categoryId?: string;
  availability?: ProductAvailability;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortDirection?: SortDirection;
  offset?: number;
  limit?: number;
}

export interface ProductSearchResponse {
  products: ProductSummary[];
  totalCount: number;
  hasMore: boolean;
}
