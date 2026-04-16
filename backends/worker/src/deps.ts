import type { Logger } from '@ecomsaas/infrastructure/logger';
import type { Queue } from '@ecomsaas/infrastructure/queue';

/**
 * Worker dependency container.
 *
 * Acts as the worker's internal "port" bundle — every processor and the
 * scheduler receive this instead of individual infrastructure references.
 * The composition root (main.ts) constructs the concrete instance.
 *
 * When use-cases land (Phase 8+), add them here rather than scattering
 * infrastructure imports across processor files.
 */
export interface WorkerDeps {
  readonly logger: Logger;
  readonly queue: Queue;
}
