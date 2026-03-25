import { ProductModel, NotFoundError, ValidationError, err } from '@ecomsaas/domain';
import type { CreateProductInput, Result } from '@ecomsaas/domain';
import type { ProductRepository, StoreRepository } from '../../ports';

/**
 * CreateProduct Use Case
 *
 * Creates a new product in a store.
 *
 * Business Rules:
 * - Store must exist
 * - Product slug must be unique within the store
 * - All product invariants must be satisfied (enforced by ProductModel)
 *
 * @example
 * ```typescript
 * const createProduct = new CreateProduct(productRepository, storeRepository);
 * const result = await createProduct.execute({
 *   id: 'prod-123',
 *   storeId: 'store-456',
 *   name: 'Sample Product',
 *   slug: 'sample-product',
 *   price: { amount: 1999n, currency: 'USD' }
 * });
 *
 * if (result.isOk()) {
 *   const product = result.unwrap();
 *   console.log('Product created:', product.name);
 * }
 * ```
 */
export class CreateProduct {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  /**
   * Execute the use case.
   *
   * @param input - CreateProductInput containing all product data
   * @returns Result with ProductModel if successful, Error if validation fails
   */
  async execute(input: CreateProductInput): Promise<Result<ProductModel, Error>> {
    // 1. Verify store exists
    const storeResult = await this.storeRepository.findById(input.storeId);
    if (storeResult.isErr()) {
      return err(new NotFoundError('Store', input.storeId));
    }

    // 2. Check slug uniqueness within the store
    const slugExists = await this.productRepository.slugExists(input.storeId, input.slug);
    if (slugExists) {
      return err(
        new ValidationError(`Product slug '${input.slug}' is already taken in this store`, {
          field: 'slug',
        })
      );
    }

    // 3. Create the product model (domain validation happens here)
    try {
      const product = ProductModel.create(input);

      // 4. Persist the product
      return this.productRepository.save(product);
    } catch (error) {
      return err(error as Error);
    }
  }
}
