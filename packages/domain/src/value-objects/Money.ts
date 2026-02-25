/**
 * Currency codes supported by the platform.
 *
 * Fiat: CAD, USD, EUR, GBP
 * Crypto: BTC, USDC (bridged stablecoin), MATIC/POL (Polygon native)
 */
export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'BTC' | 'USDC' | 'MATIC' | 'POL';

/**
 * Money value object — represents monetary amounts.
 *
 * `amount` is stored in the smallest unit of the currency (cents, satoshi,
 * wei, etc.) as a `bigint` to avoid floating-point precision issues and
 * to safely represent 18-decimal crypto amounts.
 */
export interface Money {
  amount: bigint;
  currency: CurrencyCode;
}
