import type { ProductAvailability } from '@ecomsaas/domain/enums';
import type { Money, Image } from '@ecomsaas/domain/value-objects';
import type { ProductModel, Result, NotFoundError } from '@ecomsaas/domain';
import { err, ProductModel as PM } from '@ecomsaas/domain';
import type { ProductRepository } from '../../ports';

export interface UpdateProductInput {
  id: string;
  name?: string;
  description?: string;
  price?: Money;
  compareAtPrice?: Money;
  images?: Image[];
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

/**
 * UpdateProduct use case.
 *
 * Loads the product, applies partial updates via ProductModel.fromData
 * (preserving invariants via the constructor validation), then persists.
 */
export class UpdateProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: UpdateProductInput): Promise<Result<ProductModel, NotFoundError | Error>> {
    const findResult = await this.productRepository.findById(input.id);

    if (findResult.isErr()) {
      return err(findResult.error);
    }

    const current = findResult.value;

    const updatedInventory =
      input.inventory !== undefined
        ? {
            trackQuantity:
              input.inventory.trackQuantity ?? current.inventory?.trackQuantity ?? false,
            quantity: input.inventory.quantity ?? current.inventory?.quantity ?? 0,
            ...(input.inventory.lowStockThreshold !== undefined
              ? { lowStockThreshold: input.inventory.lowStockThreshold }
              : current.inventory?.lowStockThreshold !== undefined
                ? { lowStockThreshold: current.inventory.lowStockThreshold }
                : {}),
          }
        : current.inventory;

    try {
      const updated = PM.fromData({
        id: current.id,
        storeId: current.storeId,
        name: input.name ?? current.name,
        slug: current.slug,
        description: input.description !== undefined ? input.description : current.description,
        price: input.price ?? current.price,
        compareAtPrice:
          input.compareAtPrice !== undefined ? input.compareAtPrice : current.compareAtPrice,
        images: input.images ?? current.images,
        categoryId: input.categoryId !== undefined ? input.categoryId : current.categoryId,
        supplierId: input.supplierId !== undefined ? input.supplierId : current.supplierId,
        availability: input.availability ?? current.availability,
        inventory: updatedInventory,
        variants: current.variants,
        tags: input.tags ?? current.tags,
        metadata: input.metadata ?? current.metadata,
        createdAt: current.createdAt,
        updatedAt: new Date(),
      });

      return this.productRepository.save(updated);
    } catch (error) {
      return err(error as Error);
    }
  }
}
