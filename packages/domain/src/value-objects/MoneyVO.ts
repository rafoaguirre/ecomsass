import type { Money, CurrencyCode } from './Money';
import { ValueObject } from '../core';
import { ValidationError, InvariantError } from '../errors';

/**
 * Currency-aware decimal precision map.
 *
 * Fiat currencies use 2 decimals (cents).
 * Crypto currencies use their native precision:
 *  - BTC: 8 (satoshi)
 *  - USDC: 6 (micro-USDC)
 *  - MATIC/POL: 18 (wei)
 */
const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  CAD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  BTC: 8,
  USDC: 6,
  MATIC: 18,
  POL: 18,
};

/**
 * Display symbols for fiat currencies. Crypto uses code suffix instead.
 */
const CURRENCY_SYMBOLS: Partial<Record<CurrencyCode, string>> = {
  USD: '$',
  CAD: 'CA$',
  EUR: '€',
  GBP: '£',
};

/**
 * Rich Money value object with currency-aware arithmetic, factories,
 * and formatting. Extends the base ValueObject for structural equality.
 *
 * All amounts are stored as `bigint` in the smallest unit of the currency
 * (cents, satoshi, wei, etc.). All operations return new instances (immutable).
 *
 * @example
 * ```typescript
 * const price = MoneyVO.fromDecimal('12.50', 'USD');
 * const tax = price.multiply(0.13);
 * const total = price.add(tax);
 * total.toDisplayString(); // "$14.12"
 * ```
 */
export class MoneyVO extends ValueObject<Money> {
  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  get amount(): bigint {
    return this.props.amount;
  }

  get currency(): CurrencyCode {
    return this.props.currency;
  }

  // ---------------------------------------------------------------------------
  // Constructor (private — use factories)
  // ---------------------------------------------------------------------------

  private constructor(props: Money) {
    super(props);
  }

  // ---------------------------------------------------------------------------
  // Equality (override — bigint is not JSON-serializable)
  // ---------------------------------------------------------------------------

  override equals(vo?: ValueObject<Money>): boolean {
    if (!vo || !(vo instanceof MoneyVO)) {
      return false;
    }
    if (this === vo) {
      return true;
    }
    return this.amount === vo.amount && this.currency === vo.currency;
  }

  /**
   * Returns the plain Money data object.
   */
  value(): Money {
    return { amount: this.amount, currency: this.currency };
  }

  // ---------------------------------------------------------------------------
  // Factories
  // ---------------------------------------------------------------------------

  /**
   * Create from the smallest unit of the currency (cents, satoshi, wei, etc.).
   */
  static fromSmallestUnit(amount: bigint, currency: CurrencyCode): MoneyVO {
    return new MoneyVO({ amount, currency });
  }

  /**
   * Create from a human-readable decimal string.
   *
   * @param decimal - e.g. "12.50", "0.000001", "-5.99"
   * @param currency - target currency (determines allowed decimal places)
   * @throws ValidationError if decimal format is invalid or has too many decimal places
   *
   * @example
   * ```typescript
   * MoneyVO.fromDecimal('12.50', 'USD');  // 1250 cents
   * MoneyVO.fromDecimal('1.5', 'USDC');   // 1500000 micro-USDC
   * ```
   */
  static fromDecimal(decimal: string, currency: CurrencyCode): MoneyVO {
    const precision = MoneyVO.decimalsFor(currency);
    const trimmed = decimal.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('Decimal string must not be empty', { field: 'decimal' });
    }

    const negative = trimmed.startsWith('-');
    const abs = negative ? trimmed.slice(1) : trimmed;

    const parts = abs.split('.');
    if (parts.length > 2) {
      throw new ValidationError('Invalid decimal format: multiple decimal points', {
        field: 'decimal',
      });
    }

    const whole = parts[0] ?? '0';
    const frac = parts[1] ?? '';

    if (!/^\d+$/.test(whole) || (frac.length > 0 && !/^\d+$/.test(frac))) {
      throw new ValidationError(
        'Decimal string must contain only digits and an optional decimal point',
        {
          field: 'decimal',
        }
      );
    }

    if (frac.length > precision) {
      throw new ValidationError(
        `Too many decimal places for ${currency} (max: ${String(precision)}, got: ${String(frac.length)})`,
        { field: 'decimal', currency, maxDecimals: precision }
      );
    }

    const paddedFrac = frac.padEnd(precision, '0');
    const combined = `${whole}${paddedFrac}`;
    const amount = BigInt(combined);

    return new MoneyVO({ amount: negative ? -amount : amount, currency });
  }

  /**
   * Create a zero-value Money for the given currency.
   */
  static zero(currency: CurrencyCode): MoneyVO {
    return new MoneyVO({ amount: 0n, currency });
  }

  // ---------------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------------

  /**
   * Get the number of decimal places for a currency.
   */
  static decimalsFor(currency: CurrencyCode): number {
    return CURRENCY_DECIMALS[currency];
  }

  /**
   * Full currency → decimals map.
   */
  static get CURRENCY_DECIMALS(): Readonly<Record<CurrencyCode, number>> {
    return CURRENCY_DECIMALS;
  }

  // ---------------------------------------------------------------------------
  // Arithmetic (same-currency enforced)
  // ---------------------------------------------------------------------------

  /**
   * Add two Money values. Throws if currencies differ.
   */
  add(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);
    return new MoneyVO({ amount: this.amount + other.amount, currency: this.currency });
  }

  /**
   * Subtract another Money value. Throws if currencies differ.
   */
  subtract(other: MoneyVO): MoneyVO {
    this.assertSameCurrency(other);
    return new MoneyVO({ amount: this.amount - other.amount, currency: this.currency });
  }

  /**
   * Multiply by a numeric factor. Truncates toward zero.
   *
   * Uses scaled-integer arithmetic to minimize floating-point error.
   *
   * @param factor - multiplier (e.g. 0.13 for 13% tax, 2 for doubling)
   */
  multiply(factor: number): MoneyVO {
    if (!Number.isFinite(factor)) {
      throw new InvariantError('Multiplication factor must be a finite number');
    }
    // Scale to 8 decimal places of factor precision
    const SCALE = 10n ** 8n;
    const scaledFactor = BigInt(Math.round(factor * Number(SCALE)));
    const result = (this.amount * scaledFactor) / SCALE;
    return new MoneyVO({ amount: result, currency: this.currency });
  }

  // ---------------------------------------------------------------------------
  // Comparison
  // ---------------------------------------------------------------------------

  /**
   * Compare two Money values. Throws if currencies differ.
   * @returns -1 if this < other, 0 if equal, 1 if this > other
   */
  compare(other: MoneyVO): -1 | 0 | 1 {
    this.assertSameCurrency(other);
    if (this.amount < other.amount) return -1;
    if (this.amount > other.amount) return 1;
    return 0;
  }

  isZero(): boolean {
    return this.amount === 0n;
  }

  isPositive(): boolean {
    return this.amount > 0n;
  }

  isNegative(): boolean {
    return this.amount < 0n;
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  /**
   * Returns the raw decimal string without currency symbol.
   * @example "12.50", "0.000001", "-5.99"
   */
  toDecimalString(): string {
    const precision = MoneyVO.decimalsFor(this.currency);
    if (precision === 0) {
      return this.amount.toString();
    }

    const negative = this.amount < 0n;
    const abs = negative ? -this.amount : this.amount;
    const str = abs.toString().padStart(precision + 1, '0');

    const whole = str.slice(0, str.length - precision);
    const frac = str.slice(str.length - precision);

    return `${negative ? '-' : ''}${whole}.${frac}`;
  }

  /**
   * Returns a human-readable display string with currency symbol or code.
   *
   * Fiat: "$12.50", "CA$100.00", "€50.00"
   * Crypto: "1,250.000000 USDC", "0.500000000000000000 MATIC"
   *
   * Thousand separators are applied to the whole-number portion.
   */
  toDisplayString(): string {
    const decimal = this.toDecimalString();

    const negative = decimal.startsWith('-');
    const abs = negative ? decimal.slice(1) : decimal;

    const dotIndex = abs.indexOf('.');
    const whole = dotIndex >= 0 ? abs.slice(0, dotIndex) : abs;
    const frac = dotIndex >= 0 ? abs.slice(dotIndex) : '';

    // Add thousand separators
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = `${formattedWhole}${frac}`;

    const symbol = CURRENCY_SYMBOLS[this.currency];
    if (symbol) {
      return negative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
    }
    return `${negative ? '-' : ''}${formatted} ${this.currency}`;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private assertSameCurrency(other: MoneyVO): void {
    if (this.currency !== other.currency) {
      throw new InvariantError(
        `Cannot perform arithmetic on different currencies: ${this.currency} vs ${other.currency}`
      );
    }
  }
}
