/**
 * ID Generator port for dependency injection.
 *
 * This is an application-layer port that defines the contract for ID generation.
 * Infrastructure adapters (e.g., @ecomsaas/infrastructure/id-generator) implement this interface.
 *
 * @example
 * ```typescript
 * class PlaceOrder {
 *   constructor(private readonly idGenerator: IdGenerator) {}
 *
 *   async execute(input: PlaceOrderInput) {
 *     const orderId = this.idGenerator.generate('order');
 *     // ...
 *   }
 * }
 * ```
 */
export interface IdGenerator {
  /**
   * Generate a unique ID.
   * @param prefix Optional prefix for the ID (e.g., 'order', 'item', 'note')
   * @returns A unique identifier string
   */
  generate(prefix?: string): string;

  /**
   * Generate multiple unique IDs at once.
   * Useful for batch operations.
   *
   * @param count Number of IDs to generate
   * @param prefix Optional prefix for all IDs
   * @returns Array of unique identifier strings
   */
  generateBatch(count: number, prefix?: string): string[];
}
