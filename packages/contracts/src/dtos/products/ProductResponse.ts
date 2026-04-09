import type { ProductAvailability } from '@ecomsaas/domain/enums';
import type { Image } from '@ecomsaas/domain/value-objects';
import type { MoneyResponse } from '../orders/OrderResponse';

/**
 * JSON-safe product variant for API responses
 */
export interface ProductVariantResponse {
  id: string;
  name: string;
  sku?: string;
  price?: MoneyResponse;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
  };
  attributes: Record<string, string>;
}

/**
 * Product response with JSON-safe money fields
 */
export interface ProductResponse {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  price: MoneyResponse;
  compareAtPrice?: MoneyResponse;
  images: Image[];
  categoryId?: string;
  supplierId?: string;
  availability: ProductAvailability;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
    lowStockThreshold?: number;
  };
  variants?: ProductVariantResponse[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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
    amount: string;
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
