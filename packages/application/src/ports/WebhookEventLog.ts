/**
 * Port for durable webhook idempotency.
 *
 * Prevents duplicate processing of provider webhook events across
 * process restarts and multi-instance deployments.
 */
export interface WebhookEventLog {
  isDuplicate(provider: string, eventId: string): Promise<boolean>;
  record(provider: string, eventId: string, eventType: string): Promise<void>;
}
