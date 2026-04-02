import type { ProductAvailability } from '@ecomsaas/domain/enums';
import type { ImageUpload } from '@ecomsaas/domain/value-objects';

/**
 * Create product request
 */
export interface CreateProductRequest {
  storeId: string;
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  compareAtPrice?: {
    amount: number;
    currency: string;
  };
  images?: ImageUpload[];
  categoryId?: string;
  supplierId?: string;
  availability?: ProductAvailability;
  inventory?: {
    trackQuantity: boolean;
    quantity?: number;
    lowStockThreshold?: number;
  };
  variants?: Array<{
    name: string;
    sku?: string;
    price?: {
      amount: number;
      currency: string;
    };
    attributes: Record<string, string>;
  }>;
  tags?: string[];
  metadata?: Record<string, unknown>;
}
