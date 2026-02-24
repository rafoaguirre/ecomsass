import type { Store } from '@ecomsaas/domain/entities';

/**
 * Store response
 */
export interface StoreResponse extends Store {
  vendorName: string;
  productCount?: number;
  orderCount?: number;
}

/**
 * Store summary for lists
 */
export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
