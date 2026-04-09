import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@ecomsaas/application/ports';

/**
 * UUID-based ID generator.
 * Implements the application-layer IdGenerator port.
 *
 * Uses crypto.randomUUID() (UUID v4) for database-compatible IDs.
 * The prefix parameter is accepted for interface compatibility but ignored,
 * since database columns require valid UUIDs.
 */
export class SimpleIdGenerator implements IdGenerator {
  generate(_prefix?: string): string {
    return randomUUID();
  }

  generateBatch(count: number, _prefix?: string): string[] {
    return Array.from({ length: count }, () => randomUUID());
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
