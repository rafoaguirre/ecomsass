import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SupabaseAuthGuard } from './supabase-auth.guard';

function createHttpExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('SupabaseAuthGuard', () => {
  it('attaches user when token is valid', async () => {
    const guard = new SupabaseAuthGuard({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
              app_metadata: { role: 'Vendor' },
            },
          },
          error: null,
        }),
      },
    } as any);

    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer token-123' },
    };

    const allowed = await guard.canActivate(createHttpExecutionContext(request));

    expect(allowed).toBe(true);
    expect(request['user']).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      role: 'Vendor',
    });
  });

  it('throws when bearer token is missing', async () => {
    const guard = new SupabaseAuthGuard({
      auth: {
        getUser: vi.fn(),
      },
    } as any);

    await expect(
      guard.canActivate(createHttpExecutionContext({ headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when token is invalid', async () => {
    const guard = new SupabaseAuthGuard({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'invalid jwt' },
        }),
      },
    } as any);

    await expect(
      guard.canActivate(
        createHttpExecutionContext({
          headers: { authorization: 'Bearer bad-token' },
        })
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
