import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

function createMockSupabase(error: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ error }),
    }),
  } as any;
}

describe('HealthController', () => {
  it('should return status ok when DB is healthy', async () => {
    const controller = new HealthController(createMockSupabase());
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when DB query fails', async () => {
    const controller = new HealthController(createMockSupabase({ message: 'connection refused' }));
    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toBe('degraded');
  });
});
