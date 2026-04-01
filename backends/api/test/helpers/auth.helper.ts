import type { AuthUser } from '../../src/auth/types/auth-user';

/**
 * Generates a fake Bearer token string.
 * For e2e tests against the real app (with mocked Supabase), the token
 * value itself is irrelevant — the mock controls what `auth.getUser()` returns.
 */
export function fakeToken(userId = 'test-user-1'): string {
  return `fake-jwt-${userId}`;
}

/**
 * Returns a Bearer authorization header value.
 */
export function authHeader(userId = 'test-user-1'): string {
  return `Bearer ${fakeToken(userId)}`;
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
