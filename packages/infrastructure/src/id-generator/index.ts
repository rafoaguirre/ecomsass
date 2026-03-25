// Re-export the application port interface for convenience
export type { IdGenerator } from '@ecomsaas/application/ports';

// Export infrastructure implementation
export { SimpleIdGenerator, createIdGenerator, defaultIdGenerator } from './IdGenerator';
