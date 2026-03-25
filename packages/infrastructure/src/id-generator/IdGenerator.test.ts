import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleIdGenerator, createIdGenerator } from './IdGenerator';
import type { IdGenerator } from './index';

describe('IdGenerator', () => {
  let generator: IdGenerator;

  beforeEach(() => {
    generator = new SimpleIdGenerator();
  });

  describe('generate', () => {
    it('should generate a unique ID without prefix', () => {
      const id = generator.generate();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      // Format: timestamp-random (e.g., 1711234567890-k3j2h9)
      expect(id).toMatch(/^\d+-[a-f0-9]{6}$/);
    });

    it('should generate a unique ID with prefix', () => {
      const id = generator.generate('order');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^order-\d+-[a-f0-9]{6}$/);
    });

    it('should generate different IDs on consecutive calls', () => {
      const id1 = generator.generate();
      const id2 = generator.generate();
      expect(id1).not.toBe(id2);
    });

    it('should support various prefix types', () => {
      const orderId = generator.generate('order');
      const productId = generator.generate('product');
      const userId = generator.generate('user');

      expect(orderId).toContain('order-');
      expect(productId).toContain('product-');
      expect(userId).toContain('user-');
    });
  });

  describe('generateBatch', () => {
    it('should generate multiple unique IDs', () => {
      const ids = generator.generateBatch(5);
      expect(ids).toHaveLength(5);

      // All should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should generate batch with prefix', () => {
      const ids = generator.generateBatch(3, 'item');
      expect(ids).toHaveLength(3);
      expect(ids.every((id: string) => id.startsWith('item-'))).toBe(true);
    });

    it('should handle large batch sizes', () => {
      const ids = generator.generateBatch(100);
      expect(ids).toHaveLength(100);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    it('should generate IDs with counter for uniqueness in same millisecond', () => {
      const ids = generator.generateBatch(3, 'test');

      // All IDs should be unique despite same timestamp
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);

      // Pattern: prefix-timestamp-counter-random
      expect(ids[0]).toMatch(/^test-\d+-0-[a-f0-9]{6}$/);
      expect(ids[1]).toMatch(/^test-\d+-1-[a-f0-9]{6}$/);
      expect(ids[2]).toMatch(/^test-\d+-2-[a-f0-9]{6}$/);
    });
  });

  describe('createIdGenerator', () => {
    it('should create a new ID generator instance', () => {
      const gen1 = createIdGenerator();
      const gen2 = createIdGenerator();

      expect(gen1).toBeDefined();
      expect(gen2).toBeDefined();
      expect(gen1).not.toBe(gen2);
    });

    it('should create functional generator', () => {
      const gen = createIdGenerator();
      const id = gen.generate('test');
      expect(id).toMatch(/^test-\d+-[a-f0-9]{6}$/);
    });
  });
});
