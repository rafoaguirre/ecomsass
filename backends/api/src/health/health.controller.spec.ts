import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

function createMockSupabase(error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ error }),
    }),
  } as any;
}

function createMockRedisCache(alive: boolean) {
  return { ping: vi.fn().mockResolvedValue(alive) } as any;
}

describe('HealthController', () => {
  it('should return status ok when DB is healthy and Redis disabled', async () => {
    const controller = new HealthController(createMockSupabase(), null);
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.checks.redis).toBe('disabled');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when DB query fails', async () => {
    const controller = new HealthController(
      createMockSupabase({ message: 'connection refused' }),
      null
    );
    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('degraded');
  });

  it('should return ok when both DB and Redis are healthy', async () => {
    const controller = new HealthController(createMockSupabase(), createMockRedisCache(true));
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.checks.redis).toBe('ok');
  });

  it('should return degraded when Redis is unhealthy', async () => {
    const controller = new HealthController(createMockSupabase(), createMockRedisCache(false));
    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.redis).toBe('degraded');
  });
});
