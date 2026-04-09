import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleIdGenerator, createIdGenerator } from './IdGenerator';
import type { IdGenerator } from './index';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('IdGenerator', () => {
  let generator: IdGenerator;

  beforeEach(() => {
    generator = new SimpleIdGenerator();
  });

  describe('generate', () => {
    it('should generate a valid UUID', () => {
      const id = generator.generate();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id).toMatch(UUID_RE);
    });

    it('should accept prefix parameter for interface compatibility', () => {
      const id = generator.generate('order');
      expect(id).toBeTruthy();
      expect(id).toMatch(UUID_RE);
    });

    it('should generate different IDs on consecutive calls', () => {
      const id1 = generator.generate();
      const id2 = generator.generate();
      expect(id1).not.toBe(id2);
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

    it('should generate batch of valid UUIDs', () => {
      const ids = generator.generateBatch(3, 'item');
      expect(ids).toHaveLength(3);
      expect(ids.every((id: string) => UUID_RE.test(id))).toBe(true);
    });

    it('should handle large batch sizes', () => {
      const ids = generator.generateBatch(100);
      expect(ids).toHaveLength(100);

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
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
      expect(id).toMatch(UUID_RE);
    });
  });
});
