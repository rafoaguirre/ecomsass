import type { StoreModel, Result, NotFoundError } from '@ecomsaas/domain';
import type { StoreRepository } from '../../ports';

/**
 * Input for the GetStore use case.
 */
export interface GetStoreInput {
  /**
   * Store identifier - can be either ID or slug.
   */
  identifier: string;

  /**
   * Type of identifier provided.
   * @default 'slug'
   */
  identifierType?: 'id' | 'slug';
}

/**
 * GetStore Use Case
 *
 * Retrieves a store by its ID or slug.
 * This is a read-only query operation with no side effects.
 *
 * @example
 * ```typescript
 * const getStore = new GetStore(storeRepository);
 * const result = await getStore.execute({ identifier: 'my-store-slug' });
 *
 * if (result.isOk()) {
 *   const store = result.unwrap();
 *   console.log(store.name);
 * }
 * ```
 */
export class GetStore {
  constructor(private readonly storeRepository: StoreRepository) {}

  /**
   * Execute the use case.
   *
   * @param input - GetStoreInput containing the store identifier
   * @returns Result with StoreModel if found, NotFoundError if not found
   */
  async execute(input: GetStoreInput): Promise<Result<StoreModel, NotFoundError>> {
    const { identifier, identifierType = 'slug' } = input;

    if (identifierType === 'id') {
      return this.storeRepository.findById(identifier);
    }

    return this.storeRepository.findBySlug(identifier);
  }
}
