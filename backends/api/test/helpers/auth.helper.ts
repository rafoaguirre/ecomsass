import { createHmac } from 'node:crypto';
import type { AuthUser } from '../../src/auth/types/auth-user';

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

/**
 * Sign a real HS256 JWT with the test secret.
 * The guard does real jose jwtVerify, so e2e tests must send valid tokens.
 */
function signTestJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({
      iat: now,
      exp: now + 3600,
      ...payload,
    })
  );
  const data = `${header}.${body}`;
  const sig = createHmac('sha256', TEST_JWT_SECRET).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

/**
 * Generates a signed JWT Bearer token for e2e tests.
 */
export function fakeToken(
  userId = 'test-user-1',
  options: { role?: string; email?: string } = {}
): string {
  return signTestJwt({
    sub: userId,
    email: options.email ?? `${userId}@test.com`,
    app_metadata: { role: options.role ?? 'Vendor' },
  });
}

/**
 * Returns a Bearer authorization header value with a signed JWT.
 */
export function authHeader(
  userId = 'test-user-1',
  options: { role?: string; email?: string } = {}
): string {
  return `Bearer ${fakeToken(userId, options)}`;
}

/**
 * Build an AuthUser payload with sensible defaults.
 */
export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: overrides.id ?? 'test-user-1',
    email: overrides.email ?? 'test@example.com',
    role: overrides.role ?? 'Vendor',
  };
}
