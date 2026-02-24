import type { ProductAvailability } from '../enums';
import type { Money, Image } from '../value-objects';

/**
 * Product variant
 */
export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: Money;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
  };
  attributes: Record<string, string>;
}

/**
 * Product entity
 */
export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  price: Money;
  compareAtPrice?: Money;
  images: Image[];
  categoryId?: string;
  supplierId?: string;
  availability: ProductAvailability;
  inventory?: {
    quantity: number;
    trackQuantity: boolean;
    lowStockThreshold?: number;
  };
  variants?: ProductVariant[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
