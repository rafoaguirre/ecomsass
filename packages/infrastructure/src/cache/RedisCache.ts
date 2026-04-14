import Redis from 'ioredis';
import type { Cache } from './Cache';
import { CacheError } from './Cache';

/**
 * Redis-backed cache implementation using ioredis.
 *
 * Supports key namespacing, TTL, mget/mset, and graceful shutdown.
 * Values are JSON-serialized for storage.
 */
export class RedisCache implements Cache {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(options: {
    url?: string;
    host?: string;
    port?: number;
    db?: number;
    prefix?: string;
  }) {
    this.prefix = options.prefix ? `${options.prefix}:` : '';

    if (options.url) {
      this.client = new Redis(options.url, {
        db: options.db,
        lazyConnect: true,
      });
    } else {
      this.client = new Redis({
        host: options.host ?? 'localhost',
        port: options.port ?? 6379,
        db: options.db ?? 0,
        lazyConnect: true,
      });
    }
  }

  /** Connect to Redis. Call once before using the cache. */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    this.validateKey(key);
    const raw = await this.client.get(this.prefixedKey(key));
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    this.validateKey(key);
    if (ttl !== undefined && ttl <= 0) {
      throw new CacheError('TTL must be a positive number');
    }

    const serialized = JSON.stringify(value);
    const pk = this.prefixedKey(key);

    if (ttl) {
      await this.client.set(pk, serialized, 'EX', ttl);
    } else {
      await this.client.set(pk, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    this.validateKey(key);
    await this.client.del(this.prefixedKey(key));
  }

  async has(key: string): Promise<boolean> {
    this.validateKey(key);
    const exists = await this.client.exists(this.prefixedKey(key));
    return exists === 1;
  }

  async clear(): Promise<void> {
    if (!this.prefix) {
      // Without a prefix, flush the entire database
      await this.client.flushdb();
      return;
    }

    // With a prefix, scan and delete only matching keys
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        `${this.prefix}*`,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== '0');
  }

  async mget<T = unknown>(keys: string[]): Promise<Record<string, T | undefined>> {
    if (keys.length === 0) return {};

    keys.forEach((k) => this.validateKey(k));
    const prefixedKeys = keys.map((k) => this.prefixedKey(k));
    const values = await this.client.mget(...prefixedKeys);

    const result: Record<string, T | undefined> = {};
    keys.forEach((key, index) => {
      const raw = values[index] ?? null;
      result[key] = raw !== null ? (JSON.parse(raw) as T) : undefined;
    });
    return result;
  }

  async mset<T = unknown>(entries: Record<string, T>, ttl?: number): Promise<void> {
    const pairs = Object.entries(entries);
    if (pairs.length === 0) return;

    pairs.forEach(([k]) => this.validateKey(k));

    if (ttl !== undefined && ttl <= 0) {
      throw new CacheError('TTL must be a positive number');
    }

    if (ttl) {
      // Use pipeline for atomic mset + expire
      const pipeline = this.client.pipeline();
      for (const [key, value] of pairs) {
        const pk = this.prefixedKey(key);
        pipeline.set(pk, JSON.stringify(value), 'EX', ttl);
      }
      await pipeline.exec();
    } else {
      const args: string[] = [];
      for (const [key, value] of pairs) {
        args.push(this.prefixedKey(key), JSON.stringify(value));
      }
      await this.client.mset(...args);
    }
  }

  async destroy(): Promise<void> {
    await this.client.quit();
  }

  /** Check if the Redis connection is alive. */
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  private prefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new CacheError('Cache key must be a non-empty string');
    }
  }
}
