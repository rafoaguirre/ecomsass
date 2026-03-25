import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InMemoryCache, NoOpCache, CacheError, createCache } from './Cache';
import type { Cache } from './Cache';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache({ cleanupIntervalMs: 100 });
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should set and get values', async () => {
    await cache.set('key1', 'value1');
    const value = await cache.get('key1');
    expect(value).toBe('value1');
  });

  it('should return undefined for non-existent keys', async () => {
    const value = await cache.get('non-existent');
    expect(value).toBeUndefined();
  });

  it('should handle complex values', async () => {
    const obj = { id: 1, name: 'Test', nested: { value: 42 } };
    await cache.set('obj', obj);
    const retrieved = await cache.get<typeof obj>('obj');
    expect(retrieved).toEqual(obj);
  });

  it('should delete values', async () => {
    await cache.set('key1', 'value1');
    await cache.delete('key1');
    const value = await cache.get('key1');
    expect(value).toBeUndefined();
  });

  it('should check if key exists', async () => {
    await cache.set('key1', 'value1');
    expect(await cache.has('key1')).toBe(true);
    expect(await cache.has('non-existent')).toBe(false);
  });

  it('should clear all values', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.clear();
    expect(await cache.has('key1')).toBe(false);
    expect(await cache.has('key2')).toBe(false);
  });

  it('should expire values after TTL', async () => {
    vi.useFakeTimers();

    await cache.set('key1', 'value1', 2); // 2 seconds TTL
    expect(await cache.get('key1')).toBe('value1');

    // Advance time by 3 seconds
    vi.advanceTimersByTime(3000);

    expect(await cache.get('key1')).toBeUndefined();

    vi.useRealTimers();
  });

  it('should not expire values without TTL', async () => {
    vi.useFakeTimers();

    await cache.set('key1', 'value1'); // No TTL
    vi.advanceTimersByTime(10000); // 10 seconds
    expect(await cache.get('key1')).toBe('value1');

    vi.useRealTimers();
  });

  it('should get multiple values', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');

    const values = await cache.mget(['key1', 'key2', 'missing']);
    expect(values).toEqual({
      key1: 'value1',
      key2: 'value2',
      missing: undefined,
    });
  });

  it('should set multiple values', async () => {
    await cache.mset({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });

    expect(await cache.get('key1')).toBe('value1');
    expect(await cache.get('key2')).toBe('value2');
    expect(await cache.get('key3')).toBe('value3');
  });

  it('should set multiple values with TTL', async () => {
    vi.useFakeTimers();

    await cache.mset(
      {
        key1: 'value1',
        key2: 'value2',
      },
      2
    ); // 2 seconds TTL

    expect(await cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(3000);

    expect(await cache.get('key1')).toBeUndefined();
    expect(await cache.get('key2')).toBeUndefined();

    vi.useRealTimers();
  });

  it('should throw CacheError for empty key', async () => {
    await expect(cache.get('')).rejects.toThrow(CacheError);
    await expect(cache.set('', 'value')).rejects.toThrow(CacheError);
    await expect(cache.delete('')).rejects.toThrow(CacheError);
    await expect(cache.has('')).rejects.toThrow(CacheError);
  });

  it('should throw CacheError for negative TTL', async () => {
    await expect(cache.set('key', 'value', -1)).rejects.toThrow(CacheError);
    await expect(cache.set('key', 'value', -1)).rejects.toThrow(
      'TTL must be a non-negative number'
    );
  });
});

describe('NoOpCache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new NoOpCache();
  });

  it('should always return undefined on get', async () => {
    await cache.set('key', 'value');
    expect(await cache.get('key')).toBeUndefined();
  });

  it('should always return false on has', async () => {
    await cache.set('key', 'value');
    expect(await cache.has('key')).toBe(false);
  });

  it('should return undefined for all keys in mget', async () => {
    await cache.mset({ key1: 'value1', key2: 'value2' });
    const values = await cache.mget(['key1', 'key2']);
    expect(values).toEqual({
      key1: undefined,
      key2: undefined,
    });
  });
});

describe('createCache', () => {
  afterEach(() => {
    // Clean up any memory caches
    vi.clearAllTimers();
  });

  it('should create memory cache by default', async () => {
    const cache = createCache();
    await cache.set('key', 'value');
    expect(await cache.get('key')).toBe('value');

    if (cache instanceof InMemoryCache) {
      cache.destroy();
    }
  });

  it('should create noop cache when specified', async () => {
    const cache = createCache({ type: 'noop' });
    await cache.set('key', 'value');
    expect(await cache.get('key')).toBeUndefined();
  });

  it('should expose destroy method on Cache interface', async () => {
    const cache = createCache();
    expect(typeof cache.destroy).toBe('function');

    if (cache.destroy) {
      cache.destroy();
    }
  });
});
