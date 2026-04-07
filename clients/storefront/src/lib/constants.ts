import type { ShadcnBadgeProps } from '@ecomsaas/ui/shadcn';

// ── Store types ─────────────────────────────────────────────────

export const STORE_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General',
  RESTAURANT: 'Restaurant',
  SCHOOL: 'School',
  CAFETERIA: 'Cafeteria',
  EVENTS: 'Events',
  MARKETPLACE: 'Marketplace',
};

export const STORE_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  ...Object.entries(STORE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

// ── Product availability ────────────────────────────────────────

export const AVAILABILITY: Record<
  string,
  { label: string; variant: ShadcnBadgeProps['variant']; canBuy: boolean }
> = {
  AVAILABLE: { label: 'In Stock', variant: 'success', canBuy: true },
  OUT_OF_STOCK: { label: 'Out of Stock', variant: 'danger', canBuy: false },
  DISCONTINUED: { label: 'Discontinued', variant: 'secondary', canBuy: false },
  COMING_SOON: { label: 'Coming Soon', variant: 'warning', canBuy: false },
  PRE_ORDER: { label: 'Pre-Order', variant: 'default', canBuy: true },
};
