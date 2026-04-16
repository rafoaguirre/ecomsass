import type { Job } from '@ecomsaas/infrastructure/queue';
import type { WorkerDeps } from './deps.js';

/**
 * Job name constants for scheduled/background work.
 *
 * These are shared between the scheduler (producer) and processor (consumer).
 */
export const WORKER_JOBS = {
  PAYMENT_RECONCILIATION: 'cron.payment-reconciliation',
  LOW_STOCK_ALERTS: 'cron.low-stock-alerts',
  STALE_ORDER_CLEANUP: 'cron.stale-order-cleanup',
} as const;

// ──────────────────────────────────────────────────
// Payment Reconciliation (hourly)
// ──────────────────────────────────────────────────

export interface PaymentReconciliationData {
  triggeredAt: string;
}

/**
 * Compares internal order payment statuses against the payment gateway.
 * Flags mismatches for manual review.
 *
 * Phase 7.4 stub — logs execution. Real implementation connects to
 * Stripe/payment provider in a later phase.
 */
export async function processPaymentReconciliation(
  job: Job<PaymentReconciliationData>,
  { logger }: WorkerDeps
): Promise<void> {
  const childLog = logger.child({ job: job.name, jobId: job.id });
  childLog.info('Starting payment reconciliation', { triggeredAt: job.data.triggeredAt });

  // TODO: Phase 8+ — query orders with pending/processing payments,
  // compare against Stripe payment intents, flag mismatches.

  childLog.info('Payment reconciliation complete (stub)');
}

// ──────────────────────────────────────────────────
// Low-Stock Alerts (daily)
// ──────────────────────────────────────────────────

export interface LowStockAlertData {
  triggeredAt: string;
  /** Stock threshold below which to alert. Defaults to 10. */
  threshold?: number;
}

/**
 * Scans product inventory for items below the stock threshold.
 * Enqueues notification emails to vendors.
 *
 * Phase 7.4 stub — logs execution.
 */
export async function processLowStockAlerts(
  job: Job<LowStockAlertData>,
  { logger }: WorkerDeps
): Promise<void> {
  const threshold = job.data.threshold ?? 10;
  const childLog = logger.child({ job: job.name, jobId: job.id });
  childLog.info('Scanning for low-stock products', {
    threshold,
    triggeredAt: job.data.triggeredAt,
  });

  // TODO: Phase 8+ — query products with stock < threshold,
  // group by vendor, enqueue email.low-stock-alert jobs.

  childLog.info('Low-stock scan complete (stub)', { threshold });
}

// ──────────────────────────────────────────────────
// Stale Order Cleanup (daily)
// ──────────────────────────────────────────────────

export interface StaleOrderCleanupData {
  triggeredAt: string;
  /** Max age in hours for pending orders before cancellation. Defaults to 72. */
  maxAgeHours?: number;
}

/**
 * Cancels orders stuck in `pending` status beyond the configured threshold.
 * Releases reserved inventory.
 *
 * Phase 7.4 stub — logs execution.
 */
export async function processStaleOrderCleanup(
  job: Job<StaleOrderCleanupData>,
  { logger }: WorkerDeps
): Promise<void> {
  const maxAgeHours = job.data.maxAgeHours ?? 72;
  const childLog = logger.child({ job: job.name, jobId: job.id });
  childLog.info('Scanning for stale orders', { maxAgeHours, triggeredAt: job.data.triggeredAt });

  // TODO: Phase 8+ — query orders with status=pending older than maxAgeHours,
  // transition to cancelled via OrderModel, release inventory.

  childLog.info('Stale order cleanup complete (stub)', { maxAgeHours });
}
