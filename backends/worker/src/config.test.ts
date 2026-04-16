import { describe, it, expect } from 'vitest';
import { resolveConfig } from './config.js';

describe('resolveConfig', () => {
  function withEnv(env: Record<string, string>, fn: () => void): void {
    const prev = { ...process.env };
    Object.assign(process.env, env);
    try {
      fn();
    } finally {
      process.env = prev;
    }
  }

  it('should parse REDIS_URL', () => {
    withEnv({ REDIS_URL: 'redis://:secret@myhost:6380/2' }, () => {
      const config = resolveConfig();
      expect(config.redis.host).toBe('myhost');
      expect(config.redis.port).toBe(6380);
      expect(config.redis.password).toBe('secret');
      expect(config.redis.db).toBe(2);
    });
  });

  it('should parse REDIS_HOST and REDIS_PORT', () => {
    withEnv({ REDIS_URL: '', REDIS_HOST: '10.0.0.1', REDIS_PORT: '6381' }, () => {
      const config = resolveConfig();
      expect(config.redis.host).toBe('10.0.0.1');
      expect(config.redis.port).toBe(6381);
    });
  });

  it('should default port to 6379', () => {
    withEnv({ REDIS_URL: 'redis://localhost' }, () => {
      const config = resolveConfig();
      expect(config.redis.port).toBe(6379);
    });
  });

  it('should throw if no Redis configured', () => {
    withEnv({ REDIS_URL: '', REDIS_HOST: '' }, () => {
      expect(() => resolveConfig()).toThrow('Worker requires Redis');
    });
  });

  it('should throw on invalid REDIS_URL', () => {
    withEnv({ REDIS_URL: 'not-a-url' }, () => {
      expect(() => resolveConfig()).toThrow('cannot parse as URL');
    });
  });

  it('should throw on invalid REDIS_PORT', () => {
    withEnv({ REDIS_URL: '', REDIS_HOST: 'localhost', REDIS_PORT: 'abc' }, () => {
      expect(() => resolveConfig()).toThrow('Invalid Redis port');
    });
  });

  it('should default queueName and logLevel', () => {
    withEnv({ REDIS_URL: 'redis://localhost' }, () => {
      const config = resolveConfig();
      expect(config.queueName).toBe('ecomsaas');
      expect(config.logLevel).toBe('info');
    });
  });

  it('should use custom QUEUE_NAME', () => {
    withEnv({ REDIS_URL: 'redis://localhost', QUEUE_NAME: 'custom-q' }, () => {
      const config = resolveConfig();
      expect(config.queueName).toBe('custom-q');
    });
  });
});
