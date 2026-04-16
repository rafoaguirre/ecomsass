import { parseRedisUrl, parseRedisPort } from '@ecomsaas/infrastructure/cache';
import type { RedisConnectionConfig } from '@ecomsaas/infrastructure/cache';

/**
 * Worker configuration resolved from environment variables.
 */
export interface WorkerConfig {
  redis: RedisConnectionConfig;
  /** BullMQ queue name (must match the API producer). */
  queueName: string;
  /** Node environment. */
  nodeEnv: string;
  /** Log level override. */
  logLevel: string;
}

/**
 * Resolve worker configuration from process.env.
 * Throws on missing required values.
 */
export function resolveConfig(): WorkerConfig {
  const redisUrl = process.env['REDIS_URL'];
  const redisHost = process.env['REDIS_HOST'];

  let redis: RedisConnectionConfig;

  if (redisUrl) {
    redis = parseRedisUrl(redisUrl);
  } else if (redisHost) {
    const portRaw = process.env['REDIS_PORT'] ?? '6379';
    redis = { host: redisHost, port: parseRedisPort(portRaw) };
  } else {
    throw new Error('Worker requires Redis — set REDIS_URL or REDIS_HOST');
  }

  return {
    redis,
    queueName: process.env['QUEUE_NAME'] ?? 'ecomsaas',
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    logLevel: process.env['LOG_LEVEL'] ?? 'info',
  };
}
