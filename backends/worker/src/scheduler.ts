import { Cron } from 'croner';
import type { WorkerDeps } from './deps.js';
import { WORKER_JOBS } from './processors.js';

/**
 * Cron schedule definitions.
 *
 * Each entry maps a cron expression to a job name + default data factory.
 * The scheduler enqueues jobs into BullMQ; the worker processes them.
 */
const SCHEDULES = [
  {
    name: WORKER_JOBS.PAYMENT_RECONCILIATION,
    /** Every hour at minute 0 */
    cron: '0 * * * *',
    data: () => ({ triggeredAt: new Date().toISOString() }),
  },
  {
    name: WORKER_JOBS.LOW_STOCK_ALERTS,
    /** Daily at 06:00 UTC */
    cron: '0 6 * * *',
    data: () => ({ triggeredAt: new Date().toISOString(), threshold: 10 }),
  },
  {
    name: WORKER_JOBS.STALE_ORDER_CLEANUP,
    /** Daily at 03:00 UTC */
    cron: '0 3 * * *',
    data: () => ({ triggeredAt: new Date().toISOString(), maxAgeHours: 72 }),
  },
] as const;

/**
 * Start all cron schedules. Returns a stop function that cancels all crons.
 */
export function startScheduler({ queue, logger }: WorkerDeps): () => void {
  const jobs: Cron[] = [];

  for (const schedule of SCHEDULES) {
    const cronJob = new Cron(schedule.cron, async () => {
      try {
        const jobId = await queue.add(schedule.name, schedule.data());
        logger.info(`Scheduled job enqueued: ${schedule.name}`, { jobId });
      } catch (error) {
        logger.error(`Failed to enqueue scheduled job: ${schedule.name}`, error, {
          cron: schedule.cron,
        });
      }
    });

    jobs.push(cronJob);
    logger.info(`Cron registered: ${schedule.name}`, { cron: schedule.cron });
  }

  return () => {
    for (const job of jobs) {
      job.stop();
    }
    logger.info('All cron schedules stopped');
  };
}
