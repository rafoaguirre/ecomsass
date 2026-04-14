import { Queue as BullQueue, Worker, type ConnectionOptions, type JobsOptions } from 'bullmq';
import type { Queue, Job, JobOptions, JobProcessor } from './Queue';
import { QueueError } from './Queue';

/**
 * BullMQ-backed queue implementation.
 *
 * Uses a BullMQ Queue (producer) and a lazily-created Worker (consumer)
 * sharing the same Redis connection. Handlers are dispatched by job name
 * via an internal registry, preventing jobs from being silently dropped.
 */
export class BullMQQueue implements Queue {
  private readonly queue: BullQueue;
  private readonly handlers = new Map<string, JobProcessor<unknown>>();
  private worker: Worker | null = null;
  private readonly connection: ConnectionOptions;
  private readonly queueName: string;

  constructor(options: {
    name: string;
    connection: ConnectionOptions;
    defaultJobOptions?: JobsOptions;
  }) {
    this.queueName = options.name;
    this.connection = options.connection;
    this.queue = new BullQueue(options.name, {
      connection: options.connection,
      defaultJobOptions: options.defaultJobOptions ?? {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
  }

  async add<T = unknown>(name: string, data: T, options?: JobOptions): Promise<string> {
    if (!name) {
      throw new QueueError('Job name is required');
    }

    const jobOptions: JobsOptions = {};

    if (options?.delay) {
      jobOptions.delay = options.delay;
    }

    if (options?.attempts) {
      jobOptions.attempts = options.attempts;
    }

    if (options?.deduplicationId) {
      jobOptions.jobId = options.deduplicationId;
    }

    const job = await this.queue.add(name, data, jobOptions);
    return job.id ?? name;
  }

  process<T = unknown>(name: string, handler: JobProcessor<T>): void {
    this.handlers.set(name, handler as JobProcessor<unknown>);
    this.ensureWorker();
  }

  private ensureWorker(): void {
    if (this.worker) return;

    this.worker = new Worker(
      this.queueName,
      async (bullJob) => {
        const handler = this.handlers.get(bullJob.name);
        if (!handler) return;

        const job: Job<unknown> = {
          id: bullJob.id ?? '',
          name: bullJob.name,
          data: bullJob.data,
          attempts: bullJob.attemptsMade,
          timestamp: bullJob.timestamp,
        };

        await handler(job);
      },
      { connection: this.connection }
    );
  }

  async size(): Promise<number> {
    const counts = await this.queue.getJobCounts('waiting', 'delayed', 'active');
    return (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.active ?? 0);
  }

  async clear(): Promise<void> {
    await this.queue.obliterate({ force: true });
  }

  async close(): Promise<void> {
    if (this.worker) await this.worker.close();
    await this.queue.close();
  }

  /** Get the underlying BullMQ Queue instance (for Bull Board). */
  getBullQueue(): BullQueue {
    return this.queue;
  }
}
