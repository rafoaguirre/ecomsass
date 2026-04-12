/**
 * Shared constants and formatting helpers for the orders feature.
 *
 * Single source of truth for status display metadata, money formatting,
 * and date formatting used across list, detail, and filter components.
 */

// ---------------------------------------------------------------------------
// Status display metadata
// ---------------------------------------------------------------------------

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'danger' }
> = {
  PLACED: { label: 'Placed', variant: 'default' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  PACKED: { label: 'Packed', variant: 'default' },
  IN_TRANSIT: { label: 'In Transit', variant: 'default' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
  REFUNDED: { label: 'Refunded', variant: 'danger' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', variant: 'secondary' },
};

/** Statuses shown in the filter bar (excludes terminal refund states for cleaner UX). */
export const FILTERABLE_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Convert cents integer + ISO currency code to a formatted currency string. */
export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined
): string | null {
  if (amount == null) return null;
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  });
}

/** Short date — e.g. "Apr 12, 2026" */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Date with time — e.g. "Apr 12, 2026, 3:45 PM" */
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
