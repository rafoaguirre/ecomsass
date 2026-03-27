import { Module, Global, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createSupabaseClient } from '@ecomsaas/infrastructure/database';
import { extractBearerToken } from '../common/auth/extract-bearer-token';

/**
 * Injection token for the Supabase client (service-role, bypasses RLS).
 * Use for server-side operations where full access is needed.
 */
export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');

/**
 * Injection token for the Supabase anon client.
 * Uses the anon key — RLS policies are enforced but without a user JWT,
 * so `auth.uid()` returns NULL. Request-scoped auth token propagation
 * must be added before policies relying on `auth.uid()` will work.
 */
export const SUPABASE_ANON_CLIENT = Symbol('SUPABASE_ANON_CLIENT');
export const SUPABASE_REQUEST_CLIENT = Symbol('SUPABASE_REQUEST_CLIENT');

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Global database module that provides Supabase client instances.
 *
 * Reads connection details from ConfigService (populated by the
 * secrets preload in main.ts) and exposes two clients:
 *
 * - `SUPABASE_CLIENT` — service-role key, bypasses RLS
 * - `SUPABASE_ANON_CLIENT` — anon key, respects RLS
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class StoreRepository {
 *   constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}
 * }
 * ```
 */
@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('SUPABASE_URL');
        const key = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
        return createSupabaseClient({ url, key });
      },
      inject: [ConfigService],
    },
    {
      provide: SUPABASE_ANON_CLIENT,
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('SUPABASE_URL');
        const key = config.getOrThrow<string>('SUPABASE_ANON_KEY');
        return createSupabaseClient({ url, key });
      },
      inject: [ConfigService],
    },
    {
      provide: SUPABASE_REQUEST_CLIENT,
      scope: Scope.REQUEST,
      useFactory: (config: ConfigService, request: RequestLike) => {
        const url = config.getOrThrow<string>('SUPABASE_URL');
        const key = config.getOrThrow<string>('SUPABASE_ANON_KEY');
        const accessToken = extractBearerToken(request.headers?.authorization) ?? undefined;

        return createSupabaseClient({ url, key, accessToken });
      },
      inject: [ConfigService, REQUEST],
    },
  ],
  exports: [SUPABASE_CLIENT, SUPABASE_ANON_CLIENT, SUPABASE_REQUEST_CLIENT],
})
export class DatabaseModule {}
