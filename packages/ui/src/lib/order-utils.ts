/**
 * Shared order display constants and formatting helpers.
 *
 * Used by both storefront and vendor apps. Single source of truth for
 * status display metadata, money formatting, and date formatting.
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
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format an address object into a comma-separated string. */
export function formatAddress(
  address: Record<string, string | undefined> | null | undefined
): string | null {
  if (!address) return null;
  const stateOrProvince = address.state ?? address.province;
  const zipOrPostalCode = address.zip ?? address.postalCode;
  const parts = [
    address.street,
    address.street2,
    address.city,
    stateOrProvince,
    zipOrPostalCode,
    address.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
