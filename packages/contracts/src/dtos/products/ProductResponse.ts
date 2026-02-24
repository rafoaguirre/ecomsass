import type { Product } from '@ecomsaas/domain/entities';

/**
 * Product response with additional computed fields
 */
export interface ProductResponse extends Product {
  categoryName?: string;
  supplierName?: string;
  isLowStock?: boolean;
}

/**
 * Product summary for lists
 */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: {
    amountInCents: number;
    currency: string;
  };
  mainImage?: string;
  availability: string;
}

/**
 * Product list response
 */
export interface ProductListResponse {
  products: ProductResponse[];
  totalCount: number;
}
