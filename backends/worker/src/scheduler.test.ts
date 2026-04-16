import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startScheduler } from './scheduler.js';
import { WORKER_JOBS } from './processors.js';
import type { WorkerDeps } from './deps.js';

function createMockDeps() {
  const queue = {
    add: vi.fn().mockResolvedValue('job-1'),
    process: vi.fn(),
    size: vi.fn().mockResolvedValue(0),
    clear: vi.fn(),
    close: vi.fn(),
  };
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  return { deps: { queue, logger } as unknown as WorkerDeps, queue, logger };
}

describe('startScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should register crons and log registration', () => {
    const { deps, logger } = createMockDeps();

    const stop = startScheduler(deps);

    // Should log registration for each schedule
    expect(logger.info).toHaveBeenCalledWith(
      `Cron registered: ${WORKER_JOBS.PAYMENT_RECONCILIATION}`,
      expect.objectContaining({ cron: '0 * * * *' })
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Cron registered: ${WORKER_JOBS.LOW_STOCK_ALERTS}`,
      expect.objectContaining({ cron: '0 6 * * *' })
    );
    expect(logger.info).toHaveBeenCalledWith(
      `Cron registered: ${WORKER_JOBS.STALE_ORDER_CLEANUP}`,
      expect.objectContaining({ cron: '0 3 * * *' })
    );

    stop();
    expect(logger.info).toHaveBeenCalledWith('All cron schedules stopped');
  });

  it('should return a stop function that cancels all crons', () => {
    const { deps } = createMockDeps();

    const stop = startScheduler(deps);

    // Should not throw when stopping
    expect(() => stop()).not.toThrow();
  });

  it('should log error when queue.add fails', async () => {
    const { deps, queue, logger } = createMockDeps();
    queue.add.mockRejectedValue(new Error('Redis down'));

    // Set time before creating cron so the next hour tick is deterministic
    vi.setSystemTime(new Date('2026-04-15T00:59:59.000Z'));

    const stop = startScheduler(deps);

    // Cross the hour boundary and let the async cron handler settle
    await vi.advanceTimersByTimeAsync(2000);

    expect(queue.add).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();

    stop();
  });
});
