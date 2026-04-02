import type { StoreModel, Result, NotFoundError } from '@ecomsaas/domain';

/**
 * Repository port for Store aggregate root.
 *
 * Defines the contract for persistence operations on stores.
 * Implementations are provided in the infrastructure layer.
 */
export interface StoreRepository {
  /**
   * Find a store by its unique ID.
   *
   * @param id - Store unique identifier
   * @returns Result with StoreModel if found, NotFoundError if not found
   */
  findById(id: string): Promise<Result<StoreModel, NotFoundError>>;

  /**
   * Find a store by its slug.
   *
   * @param slug - Store slug (unique URL-safe identifier)
   * @returns Result with StoreModel if found, NotFoundError if not found
   */
  findBySlug(slug: string): Promise<Result<StoreModel, NotFoundError>>;

  /**
   * Find all stores owned by a vendor.
   *
   * @param vendorProfileId - Vendor profile unique identifier
   * @returns Array of StoreModel instances
   */
  findByVendorId(vendorProfileId: string): Promise<StoreModel[]>;

  /**
   * Find all active stores.
   *
   * @returns Array of active StoreModel instances
   */
  findActive(): Promise<StoreModel[]>;

  /**
   * Save a store (create or update).
   *
   * @param store - StoreModel instance to persist
   * @returns Result with saved StoreModel
   */
  save(store: StoreModel): Promise<Result<StoreModel, Error>>;

  /**
   * Delete a store by ID.
   *
   * @param id - Store unique identifier
   * @returns Result with void on success
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Check if a slug is already taken.
   *
   * @param slug - Store slug to check
   * @param excludeId - Optional store ID to exclude from check (for updates)
   * @returns True if slug exists, false otherwise
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
