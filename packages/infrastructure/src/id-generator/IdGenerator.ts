import { randomBytes } from 'node:crypto';
import type { IdGenerator } from '@ecomsaas/application/ports';

/**
 * Simple ID generator using timestamp + random bytes.
 * Implements the application-layer IdGenerator port.
 *
 * Suitable for development and moderate-scale production use.
 *
 * Format: {prefix}-{timestamp}-{random}
 * Example: order-1711234567890-k3j2h9
 *
 * For production at scale, consider:
 * - ULID (lexicographically sortable, timestamp-based)
 * - Snowflake IDs (distributed, sortable, 64-bit)
 * - UUID v7 (timestamp-based UUID)
 */
export class SimpleIdGenerator implements IdGenerator {
  /**
   * Generate a unique ID.
   * @param prefix Optional prefix (e.g., "order", "product", "user")
   */
  generate(prefix?: string): string {
    const timestamp = Date.now();
    const random = randomBytes(3).toString('hex'); // 6 hex chars
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  }

  /**
   * Generate multiple unique IDs at once.
   * Uses a counter suffix to ensure uniqueness within the same millisecond.
   */
  generateBatch(count: number, prefix?: string): string[] {
    const timestamp = Date.now();
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const random = randomBytes(3).toString('hex');
      const id = prefix ? `${prefix}-${timestamp}-${i}-${random}` : `${timestamp}-${i}-${random}`;
      ids.push(id);
    }

    return ids;
  }
}

/**
 * Create a default ID generator instance.
 */
export function createIdGenerator(): IdGenerator {
  return new SimpleIdGenerator();
}

/**
 * Singleton instance for convenience (not recommended for testing).
 * Prefer dependency injection in production code.
 */
export const defaultIdGenerator = createIdGenerator();
