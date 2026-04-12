/**
 * Re-export shared order display utilities from @ecomsaas/ui,
 * plus storefront-specific constants.
 */

export {
  ORDER_STATUS_CONFIG,
  formatMoney,
  formatDate,
  formatDateTime,
  formatAddress,
} from '@ecomsaas/ui/order-utils';

/**
 * Ordered list of statuses used for the tracking timeline.
 * Terminal negative states (Cancelled, Refunded) are excluded —
 * they are handled separately.
 */
export const TIMELINE_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
] as const;
