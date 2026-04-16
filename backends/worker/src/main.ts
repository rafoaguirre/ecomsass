import { BullMQQueue } from '@ecomsaas/infrastructure/queue';
import { createLogger } from '@ecomsaas/infrastructure/logger';
import { resolveConfig } from './config.js';
import { startScheduler } from './scheduler.js';
import {
  WORKER_JOBS,
  processPaymentReconciliation,
  processLowStockAlerts,
  processStaleOrderCleanup,
} from './processors.js';
import type {
  PaymentReconciliationData,
  LowStockAlertData,
  StaleOrderCleanupData,
} from './processors.js';
import type { WorkerDeps } from './deps.js';

async function main(): Promise<void> {
  // 1. Resolve config (throws if Redis unconfigured)
  const config = resolveConfig();

  // 2. Create logger with resolved log level
  const logger = createLogger({ name: 'worker', level: config.logLevel });
  logger.info('Worker starting…');
  logger.info('Config resolved', {
    redis: `${config.redis.host}:${config.redis.port}`,
    queue: config.queueName,
    env: config.nodeEnv,
  });

  // 2. Create BullMQ queue (producer + consumer on same Redis)
  const queue = new BullMQQueue({
    name: config.queueName,
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      username: config.redis.username,
    },
  });

  // 3. Build dependency container (the worker's "port" bundle)
  const deps: WorkerDeps = { logger, queue };

  // 4. Register job processors
  queue.process<PaymentReconciliationData>(WORKER_JOBS.PAYMENT_RECONCILIATION, async (job) =>
    processPaymentReconciliation(job, deps)
  );

  queue.process<LowStockAlertData>(WORKER_JOBS.LOW_STOCK_ALERTS, async (job) =>
    processLowStockAlerts(job, deps)
  );

  queue.process<StaleOrderCleanupData>(WORKER_JOBS.STALE_ORDER_CLEANUP, async (job) =>
    processStaleOrderCleanup(job, deps)
  );

  logger.info('Job processors registered');

  // 5. Start cron scheduler
  const stopCrons = startScheduler(deps);
  logger.info('Cron scheduler started');

  // 6. Graceful shutdown
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`Received ${signal} — shutting down gracefully…`);

    stopCrons();

    try {
      await queue.close();
      logger.info('Queue connections closed');
    } catch (error) {
      logger.error('Error closing queue', error);
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Worker ready — processing jobs');
}

main().catch((error) => {
  // Logger may not exist if config resolution failed
  const fallback = createLogger({ name: 'worker' });
  fallback.fatal('Worker failed to start', error);
  process.exit(1);
});
