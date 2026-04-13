/**
 * Job added to a queue.
 */
export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  attempts: number;
  timestamp: number;
}

/**
 * Options for adding a job.
 */
export interface JobOptions {
  /** Delay in milliseconds before the job becomes available. */
  delay?: number;
  /** Number of retry attempts. @default 3 */
  attempts?: number;
  /** Deduplicate by this key (only one job with this key at a time). */
  deduplicationId?: string;
}

/**
 * A job processor function.
 */
export type JobProcessor<T = unknown> = (job: Job<T>) => Promise<void>;

/**
 * Queue error for validation failures.
 */
export class QueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueError';
  }
}

/**
 * Job queue interface — BullMQ-compatible design.
 *
 * Producer side: call `add()` to enqueue jobs.
 * Consumer side: call `process()` to register a handler.
 */
export interface Queue {
  /** Add a job to the queue. */
  add<T = unknown>(name: string, data: T, options?: JobOptions): Promise<string>;

  /** Register a processor for a job name. */
  process<T = unknown>(name: string, handler: JobProcessor<T>): void;

  /** Get the approximate number of pending jobs. */
  size(): Promise<number>;

  /** Remove all pending jobs. */
  clear(): Promise<void>;

  /** Graceful shutdown. */
  close(): Promise<void>;
}

/**
 * In-memory queue implementation for testing and single-instance apps.
 * Jobs are processed inline (synchronously after add) when a processor is registered.
 */
export class InMemoryQueue implements Queue {
  private jobs: Job[] = [];
  private jobIdCounter = 0;
  private processors = new Map<string, JobProcessor>();
  private deduplicationKeys = new Set<string>();

  async add<T = unknown>(name: string, data: T, options?: JobOptions): Promise<string> {
    if (options?.deduplicationId && this.deduplicationKeys.has(options.deduplicationId)) {
      return `dedup-${options.deduplicationId}`;
    }

    const id = `job-${++this.jobIdCounter}`;
    const job: Job<T> = {
      id,
      name,
      data,
      attempts: 0,
      timestamp: Date.now(),
    };

    if (options?.deduplicationId) {
      this.deduplicationKeys.add(options.deduplicationId);
    }

    this.jobs.push(job as Job);

    // Process inline if a handler is registered (no delay support in memory impl)
    const processor = this.processors.get(name);
    if (processor && !options?.delay) {
      job.attempts++;
      await processor(job as Job).catch(() => {
        // In-memory: swallow errors, keep job for inspection
      });
      this.jobs = this.jobs.filter((j) => j.id !== id);
    }

    return id;
  }

  process<T = unknown>(name: string, handler: JobProcessor<T>): void {
    this.processors.set(name, handler as JobProcessor);
  }

  async size(): Promise<number> {
    return this.jobs.length;
  }

  async clear(): Promise<void> {
    this.jobs = [];
    this.deduplicationKeys.clear();
  }

  async close(): Promise<void> {
    await this.clear();
  }
}

/**
 * Queue configuration options.
 */
export interface QueueOptions {
  /**
   * The type of queue to use.
   * @default 'memory'
   */
  type?: 'memory';

  /**
   * Queue name.
   */
  name?: string;
}

/**
 * Create a queue instance based on configuration.
 */
export function createQueue(options: QueueOptions = {}): Queue {
  const type = options.type || 'memory';

  switch (type) {
    case 'memory':
    default:
      return new InMemoryQueue();
  }
}
