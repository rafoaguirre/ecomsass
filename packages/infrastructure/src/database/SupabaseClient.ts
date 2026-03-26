import { createClient, type SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

/**
 * Re-export the Supabase client type so consumers don't need
 * to depend on @supabase/supabase-js directly.
 */
export type { SupabaseClientType as SupabaseClient };

/**
 * Configuration for creating a Supabase client.
 */
export interface SupabaseClientOptions {
  /** Supabase project URL (e.g., http://127.0.0.1:54321 for local dev). */
  url: string;

  /**
   * Key to use for authentication.
   * - `anonKey`: public client (respects RLS policies)
   * - `serviceRoleKey`: bypasses RLS (for server-side admin operations)
   */
  key: string;
}

/**
 * Create a typed Supabase client instance.
 *
 * This factory centralises client creation so that connection options,
 * auth headers, and schema configuration stay consistent across the codebase.
 *
 * @example
 * ```typescript
 * const client = createSupabaseClient({
 *   url: config.SUPABASE_URL,
 *   key: config.SUPABASE_SERVICE_ROLE_KEY,
 * });
 *
 * const { data } = await client.from('stores').select('*').eq('slug', 'demo');
 * ```
 */
export function createSupabaseClient(options: SupabaseClientOptions): SupabaseClientType {
  return createClient(options.url, options.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
