import type { OrderModel, Result, NotFoundError, OrderStatus } from '@ecomsaas/domain';

/**
 * Repository port for Order aggregate root.
 *
 * Defines the contract for persistence operations on orders.
 * Implementations are provided in the infrastructure layer.
 */
export interface OrderRepository {
  /**
   * Find an order by its unique ID.
   *
   * @param id - Order unique identifier
   * @returns Result with OrderModel if found, NotFoundError if not found
   */
  findById(id: string): Promise<Result<OrderModel, NotFoundError>>;

  /**
   * Find an order by its reference ID.
   *
   * @param referenceId - Order reference ID (human-readable order number)
   * @returns Result with OrderModel if found, NotFoundError if not found
   */
  findByReferenceId(referenceId: string): Promise<Result<OrderModel, NotFoundError>>;

  /**
   * Find all orders for a specific store.
   *
   * @param storeId - Store unique identifier
   * @param options - Optional filtering and pagination options
   * @returns Array of OrderModel instances
   */
  findByStoreId(
    storeId: string,
    options?: {
      offset?: number;
      limit?: number;
      status?: OrderStatus;
    }
  ): Promise<{ data: OrderModel[]; total: number }>;

  /**
   * Find all orders for a specific user.
   *
   * @param userId - User unique identifier
   * @param options - Optional filtering and pagination options
   * @returns Array of OrderModel instances
   */
  findByUserId(
    userId: string,
    options?: {
      offset?: number;
      limit?: number;
      status?: OrderStatus;
    }
  ): Promise<{ data: OrderModel[]; total: number }>;

  /**
   * Save an order (create or update).
   *
   * @param order - OrderModel instance to persist
   * @param expectedStatus - When provided, the save only succeeds if the
   *   current DB status matches (optimistic concurrency guard).
   *   A concurrency conflict returns an Error result.
   * @returns Result with saved OrderModel
   */
  save(order: OrderModel, expectedStatus?: OrderStatus): Promise<Result<OrderModel, Error>>;

  /**
   * Delete an order by ID.
   * Note: In practice, orders are rarely deleted; use status transitions instead.
   *
   * @param id - Order unique identifier
   * @returns Result with void on success
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Generate the next available reference ID for an order.
   * This is typically a sequential number or a formatted string.
   *
   * @param storeId - Store unique identifier
   * @returns Next available reference ID
   */
  generateReferenceId(storeId: string): Promise<string>;
}
