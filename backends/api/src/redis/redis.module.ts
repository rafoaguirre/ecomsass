import { Global, Module, Logger, Inject, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCache } from '@ecomsaas/infrastructure/cache';
import { BullMQQueue } from '@ecomsaas/infrastructure/queue';
import type { Cache } from '@ecomsaas/infrastructure/cache';
import type { Queue } from '@ecomsaas/infrastructure/queue';
import { InMemoryCache } from '@ecomsaas/infrastructure/cache';
import { InMemoryQueue } from '@ecomsaas/infrastructure/queue';

export const CACHE = Symbol('CACHE');
export const JOB_QUEUE = Symbol('JOB_QUEUE');
export const REDIS_CACHE_INSTANCE = Symbol('REDIS_CACHE_INSTANCE');

interface RedisConfig {
  /** Original URL (if provided). Used by ioredis constructor in RedisCache. */
  url?: string;
  host: string;
  port: number;
  password?: string;
  db?: number;
  username?: string;
}

/** Parse Redis config from environment. Returns null when unconfigured. */
function resolveRedisConfig(config: ConfigService): RedisConfig | null {
  const url = config.get<string>('REDIS_URL');
  const host = config.get<string>('REDIS_HOST');

  if (!url && !host) return null;

  if (url) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      logger.error(`Invalid REDIS_URL "${url}" — cannot parse as URL`);
      return null;
    }

    const port = Number(parsed.port) || 6379;
    const dbSegment = parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined;

    return {
      url,
      host: parsed.hostname,
      port,
      password: parsed.password || undefined,
      db: dbSegment !== undefined && !Number.isNaN(dbSegment) ? dbSegment : undefined,
      username: parsed.username || undefined,
    };
  }

  const portRaw = config.get<string>('REDIS_PORT') ?? '6379';
  const port = Number(portRaw);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    logger.error(`Invalid REDIS_PORT "${portRaw}" — must be a number between 1 and 65535`);
    return null;
  }

  return {
    host: host!,
    port,
  };
}

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CACHE_INSTANCE,
      useFactory: async (config: ConfigService): Promise<RedisCache | null> => {
        const rc = resolveRedisConfig(config);
        if (!rc) {
          logger.warn('Redis disabled — no REDIS_URL or REDIS_HOST configured');
          return null;
        }

        try {
          const cache = new RedisCache({
            url: rc.url,
            host: rc.host,
            port: rc.port,
            db: rc.db ?? 0,
            prefix: 'cache',
          });
          await cache.connect();
          logger.log('Redis cache connected');
          return cache;
        } catch (error) {
          logger.error(
            'Redis cache connection failed — falling back to in-memory',
            (error as Error).stack ?? String(error)
          );
          return null;
        }
      },
      inject: [ConfigService],
    },
    {
      provide: CACHE,
      useFactory: (redisCache: RedisCache | null): Cache => {
        return redisCache ?? new InMemoryCache();
      },
      inject: [REDIS_CACHE_INSTANCE],
    },
    {
      provide: JOB_QUEUE,
      useFactory: (config: ConfigService): Queue => {
        const rc = resolveRedisConfig(config);
        if (!rc) {
          logger.warn('In-memory queue active — not suitable for production');
          return new InMemoryQueue();
        }

        logger.log('BullMQ queue initialized');
        return new BullMQQueue({
          name: 'ecomsaas',
          connection: {
            host: rc.host,
            port: rc.port,
            password: rc.password,
            db: rc.db,
            username: rc.username,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CACHE, JOB_QUEUE, REDIS_CACHE_INSTANCE],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject(CACHE) private readonly cache: Cache,
    @Inject(JOB_QUEUE) private readonly queue: Queue
  ) {}

  async onModuleDestroy(): Promise<void> {
    logger.log('Shutting down Redis connections…');
    if (this.cache.destroy) await this.cache.destroy();
    await this.queue.close();
  }
}
