/**
 * Typed application configuration.
 *
 * Values are resolved once at startup via `preloadSecrets()` into
 * process.env, then available through NestJS `ConfigService`.
 */
export interface AppConfig {
  /** Supabase project URL. */
  readonly SUPABASE_URL: string;

  /** Supabase anonymous (public) key — used for client-side/RLS-aware queries. */
  readonly SUPABASE_ANON_KEY: string;

  /** Supabase service-role key — bypasses RLS, used for admin/server operations. */
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  /** HTTP port for the API server. */
  readonly PORT: string;
}

/**
 * The secret keys that MUST be present at startup.
 * Missing any of these will cause the bootstrap to fail fast.
 */
export const REQUIRED_SECRET_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;
