import type { ProductModel, Result, NotFoundError } from '@ecomsaas/domain';

/**
 * Repository port for Product aggregate root.
 *
 * Defines the contract for persistence operations on products.
 * Implementations are provided in the infrastructure layer.
 */
export interface ProductRepository {
  /**
   * Find a product by its unique ID.
   *
   * @param id - Product unique identifier
   * @returns Result with ProductModel if found, NotFoundError if not found
   */
  findById(id: string): Promise<Result<ProductModel, NotFoundError>>;

  /**
   * Find a product by its slug within a specific store.
   *
   * @param storeId - Store unique identifier
   * @param slug - Product slug (unique within the store)
   * @returns Result with ProductModel if found, NotFoundError if not found
   */
  findBySlug(storeId: string, slug: string): Promise<Result<ProductModel, NotFoundError>>;

  /**
   * Find all products in a store.
   *
   * @param storeId - Store unique identifier
   * @param options - Optional pagination and filtering options
   * @returns Array of ProductModel instances
   */
  findByStoreId(
    storeId: string,
    options?: {
      offset?: number;
      limit?: number;
      categoryId?: string;
    }
  ): Promise<ProductModel[]>;

  /**
   * Find all products in a category.
   *
   * @param categoryId - Category unique identifier
   * @param options - Optional pagination options
   * @returns Array of ProductModel instances
   */
  findByCategoryId(
    categoryId: string,
    options?: {
      offset?: number;
      limit?: number;
    }
  ): Promise<ProductModel[]>;

  /**
   * Search active products with filtering, sorting, and pagination.
   */
  searchActive(options: {
    q?: string;
    storeId?: string;
    categoryId?: string;
    availability?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }): Promise<{ data: ProductModel[]; total: number }>;

  /**
   * Save a product (create or update).
   *
   * @param product - ProductModel instance to persist
   * @returns Result with saved ProductModel
   */
  save(product: ProductModel): Promise<Result<ProductModel, Error>>;

  /**
   * Delete a product by ID.
   *
   * @param id - Product unique identifier
   * @returns Result with void on success
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Check if a slug is already taken within a store.
   *
   * @param storeId - Store unique identifier
   * @param slug - Product slug to check
   * @param excludeId - Optional product ID to exclude from check (for updates)
   * @returns True if slug exists, false otherwise
   */
  slugExists(storeId: string, slug: string, excludeId?: string): Promise<boolean>;
}
