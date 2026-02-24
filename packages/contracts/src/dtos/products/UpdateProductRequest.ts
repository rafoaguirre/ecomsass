import type { ProductAvailability } from '@ecomsaas/domain/enums';
import type { ImageUpload } from '@ecomsaas/domain/value-objects';

/**
 * Update product request
 */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: {
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
    trackQuantity?: boolean;
    quantity?: number;
    lowStockThreshold?: number;
  };
  tags?: string[];
  metadata?: Record<string, unknown>;
}
