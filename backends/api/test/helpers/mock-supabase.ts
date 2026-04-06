import { vi } from 'vitest';
import type { AuthUser } from '../../src/auth/types/auth-user';
import { buildAuthUser } from './auth.helper';

/**
 * Configurable mock for the Supabase client returned by `createSupabaseClient`.
 * Covers the surface area used by auth guards, repositories, and the request client.
 */
export interface MockSupabaseOptions {
  /**
   * When set, `auth.getUser(token)` returns this user.
   * Accepts a partial — missing fields get defaults from `buildAuthUser()`.
   * Set to `null` to simulate an invalid/expired token.
   */
  authUser?: Partial<AuthUser> | null;
}

/**
 * Create a minimal Supabase-shaped mock.
 *
 * Usage:
 * ```ts
 * const mock = createMockSupabaseClient({ authUser: { id: 'u1', role: 'Vendor' } });
 * ```
 */
export function createMockSupabaseClient(options: MockSupabaseOptions = {}) {
  const user = options.authUser === null ? null : buildAuthUser(options.authUser ?? {});

  const getUser = vi.fn().mockImplementation(() => {
    if (!user) {
      return Promise.resolve({ data: { user: null }, error: { message: 'invalid jwt' } });
    }
    return Promise.resolve({
      data: {
        user: {
          id: user.id,
          email: user.email,
          app_metadata: user.role ? { role: user.role } : {},
        },
      },
      error: null,
    });
  });

  // Chainable query builder mock for .from().select().eq().limit().maybeSingle()
  const queryResult = {
    data: null as unknown,
    error: null as unknown,
    count: null as number | null,
  };

  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    returns: vi.fn().mockImplementation(() => Promise.resolve(queryResult)),
    single: vi.fn().mockImplementation(() => Promise.resolve(queryResult)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(queryResult)),
    then: undefined as unknown, // Prevent accidental await on the builder itself
  };

  const from = vi.fn().mockReturnValue(queryBuilder);

  return {
    auth: { getUser },
    from,
    /** Escape hatch: set the next query result */
    __setQueryResult(data: unknown, error: unknown = null, count: number | null = null) {
      queryResult.data = data;
      queryResult.error = error;
      queryResult.count = count;
    },
    /** Access the chainable builder for more targeted assertions */
    __queryBuilder: queryBuilder,
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
