import { describe, expect, it } from 'vitest';

import { MoneyVO } from './MoneyVO';

describe('MoneyVO', () => {
  // ---------------------------------------------------------------------------
  // Factories — fromSmallestUnit
  // ---------------------------------------------------------------------------

  describe('fromSmallestUnit', () => {
    it('should create from cents (USD)', () => {
      const money = MoneyVO.fromSmallestUnit(1250n, 'USD');
      expect(money.amount).toBe(1250n);
      expect(money.currency).toBe('USD');
    });

    it('should create from satoshi (BTC)', () => {
      const money = MoneyVO.fromSmallestUnit(100_000_000n, 'BTC');
      expect(money.amount).toBe(100_000_000n);
      expect(money.currency).toBe('BTC');
    });

    it('should create from wei (MATIC)', () => {
      const oneToken = 10n ** 18n;
      const money = MoneyVO.fromSmallestUnit(oneToken, 'MATIC');
      expect(money.amount).toBe(oneToken);
      expect(money.currency).toBe('MATIC');
    });

    it('should allow negative amounts', () => {
      const money = MoneyVO.fromSmallestUnit(-500n, 'USD');
      expect(money.amount).toBe(-500n);
    });

    it('should allow zero', () => {
      const money = MoneyVO.fromSmallestUnit(0n, 'EUR');
      expect(money.amount).toBe(0n);
    });
  });

  // ---------------------------------------------------------------------------
  // Factories — fromDecimal
  // ---------------------------------------------------------------------------

  describe('fromDecimal', () => {
    it('should parse a standard fiat amount', () => {
      const money = MoneyVO.fromDecimal('12.50', 'USD');
      expect(money.amount).toBe(1250n);
    });

    it('should pad short fractional parts', () => {
      const money = MoneyVO.fromDecimal('12.5', 'USD');
      expect(money.amount).toBe(1250n);
    });

    it('should handle whole numbers without decimal point', () => {
      const money = MoneyVO.fromDecimal('100', 'USD');
      expect(money.amount).toBe(10000n);
    });

    it('should handle zero', () => {
      const money = MoneyVO.fromDecimal('0', 'EUR');
      expect(money.amount).toBe(0n);
    });

    it('should handle negative amounts', () => {
      const money = MoneyVO.fromDecimal('-5.99', 'USD');
      expect(money.amount).toBe(-599n);
    });

    it('should parse USDC with 6 decimals', () => {
      const money = MoneyVO.fromDecimal('1.000001', 'USDC');
      expect(money.amount).toBe(1_000_001n);
    });

    it('should parse BTC with 8 decimals', () => {
      const money = MoneyVO.fromDecimal('0.00000001', 'BTC');
      expect(money.amount).toBe(1n);
    });

    it('should parse MATIC with 18 decimals', () => {
      const money = MoneyVO.fromDecimal('1.0', 'MATIC');
      expect(money.amount).toBe(10n ** 18n);
    });

    it('should trim whitespace', () => {
      const money = MoneyVO.fromDecimal('  42.00  ', 'USD');
      expect(money.amount).toBe(4200n);
    });

    it('should reject empty string', () => {
      expect(() => MoneyVO.fromDecimal('', 'USD')).toThrow('must not be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => MoneyVO.fromDecimal('   ', 'USD')).toThrow('must not be empty');
    });

    it('should reject multiple decimal points', () => {
      expect(() => MoneyVO.fromDecimal('12.50.00', 'USD')).toThrow('multiple decimal points');
    });

    it('should reject non-numeric characters', () => {
      expect(() => MoneyVO.fromDecimal('12.5a', 'USD')).toThrow('only digits');
    });

    it('should reject too many decimal places for USD', () => {
      expect(() => MoneyVO.fromDecimal('12.505', 'USD')).toThrow('Too many decimal places');
    });

    it('should reject too many decimal places for BTC', () => {
      expect(() => MoneyVO.fromDecimal('1.000000001', 'BTC')).toThrow('Too many decimal places');
    });
  });

  // ---------------------------------------------------------------------------
  // Factories — zero
  // ---------------------------------------------------------------------------

  describe('zero', () => {
    it('should create zero USD', () => {
      const money = MoneyVO.zero('USD');
      expect(money.amount).toBe(0n);
      expect(money.currency).toBe('USD');
      expect(money.isZero()).toBe(true);
    });

    it('should create zero BTC', () => {
      const money = MoneyVO.zero('BTC');
      expect(money.amount).toBe(0n);
      expect(money.currency).toBe('BTC');
    });
  });

  // ---------------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------------

  describe('decimalsFor', () => {
    it('should return 2 for fiat currencies', () => {
      expect(MoneyVO.decimalsFor('USD')).toBe(2);
      expect(MoneyVO.decimalsFor('CAD')).toBe(2);
      expect(MoneyVO.decimalsFor('EUR')).toBe(2);
      expect(MoneyVO.decimalsFor('GBP')).toBe(2);
    });

    it('should return 8 for BTC', () => {
      expect(MoneyVO.decimalsFor('BTC')).toBe(8);
    });

    it('should return 6 for USDC', () => {
      expect(MoneyVO.decimalsFor('USDC')).toBe(6);
    });

    it('should return 18 for MATIC and POL', () => {
      expect(MoneyVO.decimalsFor('MATIC')).toBe(18);
      expect(MoneyVO.decimalsFor('POL')).toBe(18);
    });
  });

  describe('CURRENCY_DECIMALS', () => {
    it('should expose the full decimals map', () => {
      expect(MoneyVO.CURRENCY_DECIMALS.USD).toBe(2);
      expect(MoneyVO.CURRENCY_DECIMALS.BTC).toBe(8);
    });
  });

  // ---------------------------------------------------------------------------
  // Equality
  // ---------------------------------------------------------------------------

  describe('equals', () => {
    it('should be equal for same amount and currency', () => {
      const a = MoneyVO.fromSmallestUnit(1250n, 'USD');
      const b = MoneyVO.fromSmallestUnit(1250n, 'USD');
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal for different amounts', () => {
      const a = MoneyVO.fromSmallestUnit(1250n, 'USD');
      const b = MoneyVO.fromSmallestUnit(1251n, 'USD');
      expect(a.equals(b)).toBe(false);
    });

    it('should not be equal for different currencies', () => {
      const a = MoneyVO.fromSmallestUnit(1250n, 'USD');
      const b = MoneyVO.fromSmallestUnit(1250n, 'EUR');
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for undefined', () => {
      const a = MoneyVO.fromSmallestUnit(1250n, 'USD');
      expect(a.equals(undefined)).toBe(false);
    });

    it('should return true for same instance', () => {
      const a = MoneyVO.fromSmallestUnit(1250n, 'USD');
      expect(a.equals(a)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // value()
  // ---------------------------------------------------------------------------

  describe('value', () => {
    it('should return Money data object', () => {
      const money = MoneyVO.fromSmallestUnit(1250n, 'USD');
      expect(money.value()).toEqual({ amount: 1250n, currency: 'USD' });
    });
  });

  // ---------------------------------------------------------------------------
  // Arithmetic — add
  // ---------------------------------------------------------------------------

  describe('add', () => {
    it('should add two USD amounts', () => {
      const a = MoneyVO.fromDecimal('10.00', 'USD');
      const b = MoneyVO.fromDecimal('5.50', 'USD');
      const result = a.add(b);
      expect(result.amount).toBe(1550n);
      expect(result.currency).toBe('USD');
    });

    it('should add negative and positive', () => {
      const a = MoneyVO.fromSmallestUnit(-100n, 'USD');
      const b = MoneyVO.fromSmallestUnit(250n, 'USD');
      expect(a.add(b).amount).toBe(150n);
    });

    it('should throw on mismatched currencies', () => {
      const usd = MoneyVO.fromDecimal('10.00', 'USD');
      const eur = MoneyVO.fromDecimal('10.00', 'EUR');
      expect(() => usd.add(eur)).toThrow('different currencies');
    });

    it('should work with crypto amounts', () => {
      const a = MoneyVO.fromDecimal('1.0', 'USDC');
      const b = MoneyVO.fromDecimal('0.5', 'USDC');
      expect(a.add(b).amount).toBe(1_500_000n);
    });
  });

  // ---------------------------------------------------------------------------
  // Arithmetic — subtract
  // ---------------------------------------------------------------------------

  describe('subtract', () => {
    it('should subtract USD amounts', () => {
      const a = MoneyVO.fromDecimal('10.00', 'USD');
      const b = MoneyVO.fromDecimal('3.50', 'USD');
      expect(a.subtract(b).amount).toBe(650n);
    });

    it('should allow negative results', () => {
      const a = MoneyVO.fromDecimal('5.00', 'USD');
      const b = MoneyVO.fromDecimal('10.00', 'USD');
      expect(a.subtract(b).amount).toBe(-500n);
    });

    it('should throw on mismatched currencies', () => {
      const usd = MoneyVO.fromDecimal('10.00', 'USD');
      const cad = MoneyVO.fromDecimal('10.00', 'CAD');
      expect(() => usd.subtract(cad)).toThrow('different currencies');
    });
  });

  // ---------------------------------------------------------------------------
  // Arithmetic — multiply
  // ---------------------------------------------------------------------------

  describe('multiply', () => {
    it('should multiply by integer factor', () => {
      const money = MoneyVO.fromDecimal('10.00', 'USD');
      const result = money.multiply(3);
      expect(result.amount).toBe(3000n);
    });

    it('should multiply by decimal factor (tax)', () => {
      const money = MoneyVO.fromDecimal('100.00', 'USD');
      const tax = money.multiply(0.13);
      expect(tax.amount).toBe(1300n);
    });

    it('should truncate toward zero for positive', () => {
      const money = MoneyVO.fromSmallestUnit(10n, 'USD');
      const result = money.multiply(0.33);
      // 10 * 0.33 = 3.3 → truncate to 3
      expect(result.amount).toBe(3n);
    });

    it('should truncate toward zero for negative', () => {
      const money = MoneyVO.fromSmallestUnit(-10n, 'USD');
      const result = money.multiply(0.33);
      // -10 * 0.33 = -3.3 → truncate toward zero = -3
      expect(result.amount).toBe(-3n);
    });

    it('should multiply by zero', () => {
      const money = MoneyVO.fromDecimal('100.00', 'USD');
      expect(money.multiply(0).amount).toBe(0n);
    });

    it('should handle large crypto amounts', () => {
      const one = MoneyVO.fromDecimal('1.0', 'MATIC');
      const doubled = one.multiply(2);
      expect(doubled.amount).toBe(2n * 10n ** 18n);
    });

    it('should throw on Infinity', () => {
      const money = MoneyVO.fromDecimal('10.00', 'USD');
      expect(() => money.multiply(Infinity)).toThrow('finite');
    });

    it('should throw on NaN', () => {
      const money = MoneyVO.fromDecimal('10.00', 'USD');
      expect(() => money.multiply(NaN)).toThrow('finite');
    });
  });

  // ---------------------------------------------------------------------------
  // Comparison
  // ---------------------------------------------------------------------------

  describe('compare', () => {
    it('should return 0 for equal amounts', () => {
      const a = MoneyVO.fromSmallestUnit(100n, 'USD');
      const b = MoneyVO.fromSmallestUnit(100n, 'USD');
      expect(a.compare(b)).toBe(0);
    });

    it('should return -1 when this < other', () => {
      const a = MoneyVO.fromSmallestUnit(50n, 'USD');
      const b = MoneyVO.fromSmallestUnit(100n, 'USD');
      expect(a.compare(b)).toBe(-1);
    });

    it('should return 1 when this > other', () => {
      const a = MoneyVO.fromSmallestUnit(100n, 'USD');
      const b = MoneyVO.fromSmallestUnit(50n, 'USD');
      expect(a.compare(b)).toBe(1);
    });

    it('should throw on mismatched currencies', () => {
      const usd = MoneyVO.fromSmallestUnit(100n, 'USD');
      const gbp = MoneyVO.fromSmallestUnit(100n, 'GBP');
      expect(() => usd.compare(gbp)).toThrow('different currencies');
    });
  });

  describe('isZero / isPositive / isNegative', () => {
    it('should detect zero', () => {
      const money = MoneyVO.zero('USD');
      expect(money.isZero()).toBe(true);
      expect(money.isPositive()).toBe(false);
      expect(money.isNegative()).toBe(false);
    });

    it('should detect positive', () => {
      const money = MoneyVO.fromSmallestUnit(100n, 'USD');
      expect(money.isPositive()).toBe(true);
      expect(money.isZero()).toBe(false);
      expect(money.isNegative()).toBe(false);
    });

    it('should detect negative', () => {
      const money = MoneyVO.fromSmallestUnit(-100n, 'USD');
      expect(money.isNegative()).toBe(true);
      expect(money.isZero()).toBe(false);
      expect(money.isPositive()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Formatting — toDecimalString
  // ---------------------------------------------------------------------------

  describe('toDecimalString', () => {
    it('should format USD', () => {
      expect(MoneyVO.fromSmallestUnit(1250n, 'USD').toDecimalString()).toBe('12.50');
    });

    it('should format zero USD', () => {
      expect(MoneyVO.zero('USD').toDecimalString()).toBe('0.00');
    });

    it('should format fractional cents', () => {
      expect(MoneyVO.fromSmallestUnit(1n, 'USD').toDecimalString()).toBe('0.01');
    });

    it('should format negative amounts', () => {
      expect(MoneyVO.fromSmallestUnit(-599n, 'USD').toDecimalString()).toBe('-5.99');
    });

    it('should format BTC with 8 decimals', () => {
      expect(MoneyVO.fromSmallestUnit(100_000_000n, 'BTC').toDecimalString()).toBe('1.00000000');
    });

    it('should format 1 satoshi', () => {
      expect(MoneyVO.fromSmallestUnit(1n, 'BTC').toDecimalString()).toBe('0.00000001');
    });

    it('should format USDC with 6 decimals', () => {
      expect(MoneyVO.fromSmallestUnit(1_500_000n, 'USDC').toDecimalString()).toBe('1.500000');
    });

    it('should format MATIC with 18 decimals', () => {
      const oneToken = 10n ** 18n;
      expect(MoneyVO.fromSmallestUnit(oneToken, 'MATIC').toDecimalString()).toBe(
        '1.000000000000000000'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Formatting — toDisplayString
  // ---------------------------------------------------------------------------

  describe('toDisplayString', () => {
    it('should use $ symbol for USD', () => {
      expect(MoneyVO.fromDecimal('12.50', 'USD').toDisplayString()).toBe('$12.50');
    });

    it('should use CA$ for CAD', () => {
      expect(MoneyVO.fromDecimal('100.00', 'CAD').toDisplayString()).toBe('CA$100.00');
    });

    it('should use € for EUR', () => {
      expect(MoneyVO.fromDecimal('50.00', 'EUR').toDisplayString()).toBe('€50.00');
    });

    it('should use £ for GBP', () => {
      expect(MoneyVO.fromDecimal('75.00', 'GBP').toDisplayString()).toBe('£75.00');
    });

    it('should use code suffix for crypto', () => {
      expect(MoneyVO.fromDecimal('1.500000', 'USDC').toDisplayString()).toBe('1.500000 USDC');
    });

    it('should add thousand separators', () => {
      expect(MoneyVO.fromDecimal('1250.00', 'USD').toDisplayString()).toBe('$1,250.00');
    });

    it('should add thousand separators for large amounts', () => {
      expect(MoneyVO.fromDecimal('1000000.00', 'USD').toDisplayString()).toBe('$1,000,000.00');
    });

    it('should format negative fiat', () => {
      expect(MoneyVO.fromDecimal('-12.50', 'USD').toDisplayString()).toBe('-$12.50');
    });

    it('should format negative crypto', () => {
      expect(MoneyVO.fromDecimal('-1.500000', 'USDC').toDisplayString()).toBe('-1.500000 USDC');
    });

    it('should add thousand separators to crypto', () => {
      expect(MoneyVO.fromSmallestUnit(1_250_000_000n, 'USDC').toDisplayString()).toBe(
        '1,250.000000 USDC'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------

  describe('immutability', () => {
    it('should not modify original on add', () => {
      const a = MoneyVO.fromDecimal('10.00', 'USD');
      const b = MoneyVO.fromDecimal('5.00', 'USD');
      const result = a.add(b);
      expect(a.amount).toBe(1000n);
      expect(result.amount).toBe(1500n);
    });

    it('should not modify original on multiply', () => {
      const money = MoneyVO.fromDecimal('10.00', 'USD');
      const result = money.multiply(2);
      expect(money.amount).toBe(1000n);
      expect(result.amount).toBe(2000n);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle very large crypto amounts', () => {
      // 1 billion MATIC tokens in wei
      const amount = 1_000_000_000n * 10n ** 18n;
      const money = MoneyVO.fromSmallestUnit(amount, 'MATIC');
      expect(money.amount).toBe(amount);
      expect(money.toDecimalString()).toBe('1000000000.000000000000000000');
    });

    it('should preserve precision across add operations', () => {
      const a = MoneyVO.fromDecimal('0.000001', 'USDC');
      const b = MoneyVO.fromDecimal('0.000001', 'USDC');
      expect(a.add(b).amount).toBe(2n);
    });

    it('should roundtrip through fromDecimal and toDecimalString', () => {
      const original = '123.45';
      const money = MoneyVO.fromDecimal(original, 'USD');
      expect(money.toDecimalString()).toBe(original);
    });

    it('should roundtrip BTC through fromDecimal and toDecimalString', () => {
      const original = '0.00100000';
      const money = MoneyVO.fromDecimal(original, 'BTC');
      expect(money.toDecimalString()).toBe(original);
    });
  });
});
