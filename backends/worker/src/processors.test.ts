import { describe, it, expect, vi } from 'vitest';
import type { Job } from '@ecomsaas/infrastructure/queue';
import type { WorkerDeps } from './deps.js';
import {
  processPaymentReconciliation,
  processLowStockAlerts,
  processStaleOrderCleanup,
  type PaymentReconciliationData,
  type LowStockAlertData,
  type StaleOrderCleanupData,
} from './processors.js';

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

function createMockQueue() {
  return {
    add: vi.fn().mockResolvedValue('job-1'),
    process: vi.fn(),
    size: vi.fn().mockResolvedValue(0),
    clear: vi.fn(),
    close: vi.fn(),
  };
}

function createDeps(): { deps: WorkerDeps; logger: ReturnType<typeof createMockLogger> } {
  const logger = createMockLogger();
  const queue = createMockQueue();
  return { deps: { logger, queue } as unknown as WorkerDeps, logger };
}

function makeJob<T>(name: string, data: T): Job<T> {
  return { id: 'test-1', name, data, attempts: 0, timestamp: Date.now() };
}

describe('processors', () => {
  describe('processPaymentReconciliation', () => {
    it('should log start and completion', async () => {
      const { deps, logger } = createDeps();
      const job = makeJob<PaymentReconciliationData>('cron.payment-reconciliation', {
        triggeredAt: '2026-04-15T00:00:00.000Z',
      });

      await processPaymentReconciliation(job, deps);

      expect(logger.child).toHaveBeenCalledWith({ job: job.name, jobId: job.id });
      expect(logger.info).toHaveBeenCalledWith(
        'Starting payment reconciliation',
        expect.objectContaining({ triggeredAt: '2026-04-15T00:00:00.000Z' })
      );
      expect(logger.info).toHaveBeenCalledWith('Payment reconciliation complete (stub)');
    });
  });

  describe('processLowStockAlerts', () => {
    it('should log with default threshold', async () => {
      const { deps, logger } = createDeps();
      const job = makeJob<LowStockAlertData>('cron.low-stock-alerts', {
        triggeredAt: '2026-04-15T06:00:00.000Z',
      });

      await processLowStockAlerts(job, deps);

      expect(logger.info).toHaveBeenCalledWith(
        'Scanning for low-stock products',
        expect.objectContaining({ threshold: 10 })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Low-stock scan complete (stub)',
        expect.objectContaining({ threshold: 10 })
      );
    });

    it('should use custom threshold', async () => {
      const { deps, logger } = createDeps();
      const job = makeJob<LowStockAlertData>('cron.low-stock-alerts', {
        triggeredAt: '2026-04-15T06:00:00.000Z',
        threshold: 5,
      });

      await processLowStockAlerts(job, deps);

      expect(logger.info).toHaveBeenCalledWith(
        'Scanning for low-stock products',
        expect.objectContaining({ threshold: 5 })
      );
    });
  });

  describe('processStaleOrderCleanup', () => {
    it('should log with default maxAgeHours', async () => {
      const { deps, logger } = createDeps();
      const job = makeJob<StaleOrderCleanupData>('cron.stale-order-cleanup', {
        triggeredAt: '2026-04-15T03:00:00.000Z',
      });

      await processStaleOrderCleanup(job, deps);

      expect(logger.info).toHaveBeenCalledWith(
        'Scanning for stale orders',
        expect.objectContaining({ maxAgeHours: 72 })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Stale order cleanup complete (stub)',
        expect.objectContaining({ maxAgeHours: 72 })
      );
    });

    it('should use custom maxAgeHours', async () => {
      const { deps, logger } = createDeps();
      const job = makeJob<StaleOrderCleanupData>('cron.stale-order-cleanup', {
        triggeredAt: '2026-04-15T03:00:00.000Z',
        maxAgeHours: 24,
      });

      await processStaleOrderCleanup(job, deps);

      expect(logger.info).toHaveBeenCalledWith(
        'Scanning for stale orders',
        expect.objectContaining({ maxAgeHours: 24 })
      );
    });
  });
});
