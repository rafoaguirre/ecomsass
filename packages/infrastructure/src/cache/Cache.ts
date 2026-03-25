/**
 * Cache interface for dependency injection.
 */
export interface Cache {
  /**
   * Get a value from the cache.
   * @param key - The cache key
   * @returns The cached value, or undefined if not found or expired
   */
  get<T = unknown>(key: string): Promise<T | undefined>;

  /**
   * Set a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value from the cache.
   * @param key - The cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists in the cache.
   * @param key - The cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all values from the cache.
   */
  clear(): Promise<void>;

  /**
   * Destroy the cache and release resources (for implementations with timers/connections).
   * Optional - not all implementations need cleanup.
   */
  destroy?(): void | Promise<void>;

  /**
   * Get multiple values at once.
   * @param keys - Array of cache keys
   * @returns Object mapping keys to values (undefined for missing keys)
   */
  mget<T = unknown>(keys: string[]): Promise<Record<string, T | undefined>>;

  /**
   * Set multiple values at once.
   * @param entries - Object mapping keys to values
   * @param ttl - Time to live in seconds (optional, applies to all entries)
   */
  mset<T = unknown>(entries: Record<string, T>, ttl?: number): Promise<void>;
}

/**
 * Cache error for validation failures.
 */
export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Cache entry with expiration tracking.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

/**
 * In-memory cache implementation using Map.
 * Suitable for single-instance applications or testing.
 */
export class InMemoryCache implements Cache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: { cleanupIntervalMs?: number } = {}) {
    // Periodically clean up expired entries
    const intervalMs = options.cleanupIntervalMs || 60000; // 1 minute default
    this.cleanupInterval = setInterval(() => this.cleanup(), intervalMs);

    // Don't prevent Node.js from exiting when this is the only thing active
    this.cleanupInterval.unref();
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    this.validateKey(key);
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    this.validateKey(key);
    if (ttl !== undefined && ttl < 0) {
      throw new CacheError('TTL must be a non-negative number');
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };

    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.validateKey(key);
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    this.validateKey(key);
    const value = await this.get(key);
    return value !== undefined;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async mget<T = unknown>(keys: string[]): Promise<Record<string, T | undefined>> {
    // Parallel execution for better performance
    const values = await Promise.all(keys.map((key) => this.get<T>(key)));

    const result: Record<string, T | undefined> = {};
    keys.forEach((key, index) => {
      result[key] = values[index];
    });

    return result;
  }

  async mset<T = unknown>(entries: Record<string, T>, ttl?: number): Promise<void> {
    // Parallel execution for better performance
    await Promise.all(Object.entries(entries).map(([key, value]) => this.set(key, value, ttl)));
  }

  /**
   * Clean up expired entries.
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the cache and stop cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.store.clear();
  }

  /**
   * Validate cache key.
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new CacheError('Cache key must be a non-empty string');
    }
  }
}

/**
 * No-op cache that doesn't store anything.
 * Useful for disabling caching in certain environments.
 */
export class NoOpCache implements Cache {
  async get<T = unknown>(_key: string): Promise<T | undefined> {
    return undefined;
  }

  async set<T = unknown>(_key: string, _value: T, _ttl?: number): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }

  async has(_key: string): Promise<boolean> {
    return false;
  }

  async clear(): Promise<void> {
    // No-op
  }

  async mget<T = unknown>(keys: string[]): Promise<Record<string, T | undefined>> {
    return Object.fromEntries(keys.map((k) => [k, undefined]));
  }

  async mset<T = unknown>(_entries: Record<string, T>, _ttl?: number): Promise<void> {
    // No-op
  }
}

/**
 * Cache configuration options.
 */
export interface CacheOptions {
  /**
   * The type of cache to use.
   * @default 'memory'
   */
  type?: 'memory' | 'noop';

  /**
   * Cleanup interval in milliseconds (for in-memory cache).
   * @default 60000 (1 minute)
   */
  cleanupIntervalMs?: number;
}

/**
 * Create a cache instance based on configuration.
 */
export function createCache(options: CacheOptions = {}): Cache {
  const type = options.type || 'memory';

  switch (type) {
    case 'noop':
      return new NoOpCache();
    case 'memory':
    default:
      return new InMemoryCache({
        cleanupIntervalMs: options.cleanupIntervalMs,
      });
  }
}
