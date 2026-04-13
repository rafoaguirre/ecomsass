import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';
import { SupabaseAuthGuard } from './supabase-auth.guard';

const TEST_SECRET = 'test-jwt-secret-at-least-32-chars-long';
const SECRET_BYTES = new TextEncoder().encode(TEST_SECRET);

function createHttpExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(): SupabaseAuthGuard {
  const config = {
    getOrThrow: vi.fn().mockReturnValue(TEST_SECRET),
  } as unknown as ConfigService;
  return new SupabaseAuthGuard(config);
}

async function signToken(
  payload: Record<string, unknown>,
  options?: { exp?: string }
): Promise<string> {
  const builder = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt();
  if (options?.exp) {
    builder.setExpirationTime(options.exp);
  } else {
    builder.setExpirationTime('1h');
  }
  return builder.sign(SECRET_BYTES);
}

describe('SupabaseAuthGuard', () => {
  it('attaches user when token is valid', async () => {
    const guard = createGuard();
    const token = await signToken({
      sub: 'user-1',
      email: 'user@example.com',
      app_metadata: { role: 'Vendor' },
    });

    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
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
    const guard = createGuard();

    await expect(
      guard.canActivate(createHttpExecutionContext({ headers: {} }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when token is invalid', async () => {
    const guard = createGuard();

    await expect(
      guard.canActivate(
        createHttpExecutionContext({
          headers: { authorization: 'Bearer bad-token' },
        })
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('defaults to Customer role when no role in metadata', async () => {
    const guard = createGuard();
    const token = await signToken({
      sub: 'user-2',
      email: 'buyer@example.com',
    });

    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
    };

    await guard.canActivate(createHttpExecutionContext(request));

    expect((request['user'] as any).role).toBe('Customer');
  });
});
