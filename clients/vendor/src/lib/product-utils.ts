export const PRODUCT_AVAILABILITY = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'COMING_SOON', label: 'Coming Soon' },
] as const;

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

export function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parsePriceToCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}
