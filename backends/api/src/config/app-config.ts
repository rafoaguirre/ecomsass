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

  /** Supabase JWT secret — used for local JWT verification in auth guard. */
  readonly SUPABASE_JWT_SECRET: string;

  /** HTTP port for the API server. */
  readonly PORT: string;

  /** Stripe secret key — used for server-side Stripe API calls. */
  readonly STRIPE_SECRET_KEY: string;

  /** Stripe webhook signing secret — used to verify webhook signatures. */
  readonly STRIPE_WEBHOOK_SECRET: string;

  /** Redis connection URL (e.g. redis://localhost:6379). Optional — falls back to in-memory. */
  readonly REDIS_URL?: string;

  /** Redis host when not using REDIS_URL. @default 'localhost' */
  readonly REDIS_HOST?: string;

  /** Redis port when not using REDIS_URL. @default '6379' */
  readonly REDIS_PORT?: string;

  /** Bull Board admin username. @default 'admin' */
  readonly BULL_BOARD_USER?: string;

  /** Bull Board admin password. Required in production to enable Bull Board. */
  readonly BULL_BOARD_PASSWORD?: string;

  /** Resend API key. Optional — falls back to console email sender. */
  readonly RESEND_API_KEY?: string;

  /** Default sender email address. @default 'noreply@ecomsaas.dev' */
  readonly EMAIL_FROM?: string;

  /** Default sender display name. @default 'EcomSaaS' */
  readonly EMAIL_FROM_NAME?: string;
}

/**
 * The secret keys that MUST be present at startup.
 * Missing any of these will cause the bootstrap to fail fast.
 */
export const REQUIRED_SECRET_KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;
