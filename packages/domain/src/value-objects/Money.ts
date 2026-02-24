/**
 * Currency codes supported by the platform
 */
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'BTC';

/**
 * Money value object - represents monetary amounts
 * Amounts are stored in cents (smallest currency unit) to avoid floating point issues
 */
export interface Money {
  amountInCents: number;
  currency: CurrencyCode;
}
