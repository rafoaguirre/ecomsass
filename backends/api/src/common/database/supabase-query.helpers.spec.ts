import { describe, it, expect } from 'vitest';
import { clampPageSize, clampOffset, toPaginatedResult } from './supabase-query.helpers';

describe('supabase-query.helpers', () => {
  describe('clampPageSize', () => {
    it('returns default (20) for undefined', () => {
      expect(clampPageSize(undefined)).toBe(20);
    });

    it('returns default for zero', () => {
      expect(clampPageSize(0)).toBe(20);
    });

    it('returns default for negative', () => {
      expect(clampPageSize(-5)).toBe(20);
    });

    it('respects value within range', () => {
      expect(clampPageSize(50)).toBe(50);
    });

    it('caps at max (100)', () => {
      expect(clampPageSize(200)).toBe(100);
    });
  });

  describe('clampOffset', () => {
    it('returns 0 for undefined', () => {
      expect(clampOffset(undefined)).toBe(0);
    });

    it('returns 0 for negative', () => {
      expect(clampOffset(-1)).toBe(0);
    });

    it('respects non-negative value', () => {
      expect(clampOffset(10)).toBe(10);
    });
  });

  describe('toPaginatedResult', () => {
    it('marks hasMore=true when more results exist', () => {
      const result = toPaginatedResult(['a', 'b'], 10, 0, 2);
      expect(result).toEqual({
        data: ['a', 'b'],
        total: 10,
        offset: 0,
        limit: 2,
        hasMore: true,
      });
    });

    it('marks hasMore=false at the end', () => {
      const result = toPaginatedResult(['a'], 3, 2, 2);
      expect(result).toEqual({
        data: ['a'],
        total: 3,
        offset: 2,
        limit: 2,
        hasMore: false,
      });
    });

    it('handles empty results', () => {
      const result = toPaginatedResult([], 0, 0, 20);
      expect(result).toEqual({
        data: [],
        total: 0,
        offset: 0,
        limit: 20,
        hasMore: false,
      });
    });
  });
});
