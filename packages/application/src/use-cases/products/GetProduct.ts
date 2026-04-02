import type { ProductModel, Result, NotFoundError } from '@ecomsaas/domain';
import type { ProductRepository } from '../../ports';

/**
 * Input for the GetProduct use case.
 */
export interface GetProductInput {
  /** Product identifier — UUID when identifierType is 'id'. */
  identifier: string;
  identifierType?: 'id' | 'slug';
  /** Required when identifierType is 'slug'. */
  storeId?: string;
}

/**
 * GetProduct use case — read-only query, no side effects.
 */
export class GetProduct {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: GetProductInput): Promise<Result<ProductModel, NotFoundError>> {
    const { identifier, identifierType = 'id', storeId } = input;

    if (identifierType === 'slug' && storeId) {
      return this.productRepository.findBySlug(storeId, identifier);
    }

    return this.productRepository.findById(identifier);
  }
}
