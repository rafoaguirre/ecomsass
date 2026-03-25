/**
 * Secrets manager interface for dependency injection.
 */
export interface SecretsManager {
  /**
   * Get a secret value by key.
   * @param key - The secret key
   * @returns The secret value, or undefined if not found
   */
  get(key: string): Promise<string | undefined>;

  /**
   * Get a secret value by key, throwing if not found.
   * @param key - The secret key
   * @throws {SecretNotFoundError} if the secret is not found
   */
  getRequired(key: string): Promise<string>;

  /**
   * Set a secret value (for testing/local dev).
   * @param key - The secret key
   * @param value - The secret value
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Check if a secret exists.
   * @param key - The secret key
   */
  has(key: string): Promise<boolean>;
}

/**
 * Minimal Infisical client contract used by this package.
 * The default SDK-backed implementation lives in infrastructure.
 * A custom client can still be provided for tests or specialized environments.
 */
export interface InfisicalClient {
  getSecret(key: string): Promise<string | undefined>;
}

export interface InfisicalSecretsConfig {
  clientId: string;
  clientSecret: string;
  projectId: string;
  environment: string;
  secretPath?: string;
  siteUrl?: string;
}

type InfisicalSdkLike = {
  auth: () => {
    universalAuth: {
      login: (params: { clientId: string; clientSecret: string }) => Promise<unknown>;
    };
  };
  secrets: () => {
    getSecret: (params: {
      environment: string;
      projectId: string;
      secretPath: string;
      secretName: string;
      includeImports: boolean;
      viewSecretValue: boolean;
    }) => Promise<{ secretValue?: string }>;
  };
};

/**
 * Error thrown when a required secret is not found.
 */
export class SecretNotFoundError extends Error {
  constructor(key: string) {
    super(`Required secret not found: ${key}`);
    this.name = 'SecretNotFoundError';
  }
}

/**
 * Environment variable based secrets manager.
 * This is the simplest implementation, suitable for local development.
 */
export class EnvSecretsManager implements SecretsManager {
  private readonly cache = new Map<string, string>();

  constructor(private readonly env: Record<string, string | undefined> = process.env) {}

  async get(key: string): Promise<string | undefined> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check environment
    const value = this.env[key];
    if (value !== undefined) {
      this.cache.set(key, value);
    }

    return value;
  }

  async getRequired(key: string): Promise<string> {
    const value = await this.get(key);
    if (value === undefined) {
      throw new SecretNotFoundError(key);
    }
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    this.env[key] = value;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }
}

/**
 * In-memory secrets manager for testing.
 */
export class InMemorySecretsManager implements SecretsManager {
  private readonly secrets = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }

  async getRequired(key: string): Promise<string> {
    const value = this.secrets.get(key);
    if (value === undefined) {
      throw new SecretNotFoundError(key);
    }
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }

  async has(key: string): Promise<boolean> {
    return this.secrets.has(key);
  }

  /**
   * Clear all secrets (useful for test cleanup).
   */
  clear(): void {
    this.secrets.clear();
  }
}

/**
 * Infisical-backed secrets manager with in-process caching.
 * Performs remote lookup on cache miss only.
 */
export class InfisicalSecretsManager implements SecretsManager {
  private readonly cache = new Map<string, string>();

  constructor(private readonly client: InfisicalClient) {}

  async get(key: string): Promise<string | undefined> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = await this.client.getSecret(key);
    if (value !== undefined) {
      this.cache.set(key, value);
    }

    return value;
  }

  async getRequired(key: string): Promise<string> {
    const value = await this.get(key);
    if (value === undefined) {
      throw new SecretNotFoundError(key);
    }
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    // Local override for tests/bootstrap scenarios.
    this.cache.set(key, value);
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }
}

/**
 * Infisical SDK client implementation.
 * Handles authentication and secret retrieval through the official SDK.
 */
export class InfisicalSdkClient implements InfisicalClient {
  private sdk?: InfisicalSdkLike;
  private authenticatePromise?: Promise<void>;

  constructor(private readonly config: InfisicalSecretsConfig) {
    // Lazy initialization - loads SDK only when needed.
  }

  async getSecret(key: string): Promise<string | undefined> {
    const sdk = await this.getSdk();
    await this.ensureAuthenticated();

    const response = await sdk.secrets().getSecret({
      environment: this.config.environment,
      projectId: this.config.projectId,
      secretPath: this.config.secretPath ?? '/',
      secretName: key,
      includeImports: true,
      viewSecretValue: true,
    });

    return response.secretValue;
  }

  private async ensureAuthenticated(): Promise<void> {
    const sdk = await this.getSdk();

    if (!this.authenticatePromise) {
      this.authenticatePromise = sdk
        .auth()
        .universalAuth.login({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
        })
        .then(() => undefined);
    }

    await this.authenticatePromise;
  }

  private async getSdk(): Promise<InfisicalSdkLike> {
    if (this.sdk) {
      return this.sdk;
    }

    const moduleName = '@infisical/sdk';
    const mod = (await import(moduleName)) as {
      InfisicalSDK?: new (options?: { siteUrl?: string }) => InfisicalSdkLike;
    };

    if (!mod.InfisicalSDK) {
      throw new Error(
        "Failed to load '@infisical/sdk'. Ensure it is installed in the runtime environment."
      );
    }

    const sdk = new mod.InfisicalSDK({
      siteUrl: this.config.siteUrl,
    });

    this.sdk = sdk;
    return sdk;
  }
}

export interface ApplySecretsToEnvOptions {
  env?: Record<string, string | undefined>;
  overwriteExisting?: boolean;
}

/**
 * Attach resolved secrets to a target env object (defaults to process.env).
 */
export function applySecretsToEnv(
  secrets: Record<string, string>,
  options: ApplySecretsToEnvOptions = {}
): void {
  const env = options.env ?? process.env;
  const overwriteExisting = options.overwriteExisting ?? false;

  for (const [key, value] of Object.entries(secrets)) {
    if (!overwriteExisting && env[key] !== undefined) {
      continue;
    }
    env[key] = value;
  }
}

export interface PreloadSecretsOptions extends ApplySecretsToEnvOptions {
  attachToEnv?: boolean;
}

/**
 * Preload required secrets once at startup.
 * Returns a typed map that can be injected throughout the app.
 */
export async function preloadSecrets(
  manager: SecretsManager,
  requiredKeys: string[],
  options: PreloadSecretsOptions = {}
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  for (const key of requiredKeys) {
    resolved[key] = await manager.getRequired(key);
  }

  if (options.attachToEnv) {
    applySecretsToEnv(resolved, options);
  }

  return resolved;
}

/**
 * Secrets manager options.
 */
export interface SecretsManagerOptions {
  /**
   * The type of secrets manager to use.
   * @default 'env'
   */
  type?: 'env' | 'memory' | 'infisical';

  /**
   * Custom environment object (for testing).
   */
  env?: Record<string, string | undefined>;

  /**
   * Infisical SDK configuration used when type='infisical'.
   */
  infisical?: InfisicalSecretsConfig;

  /**
   * Optional custom Infisical client implementation (useful for tests).
   */
  infisicalClient?: InfisicalClient;
}

/**
 * Create a secrets manager based on configuration.
 */
export function createSecretsManager(options: SecretsManagerOptions = {}): SecretsManager {
  const type = options.type || 'env';

  switch (type) {
    case 'memory':
      return new InMemorySecretsManager();
    case 'infisical':
      if (options.infisicalClient) {
        return new InfisicalSecretsManager(options.infisicalClient);
      }
      if (!options.infisical) {
        throw new Error(
          "Missing 'infisical' config for type='infisical'. Provide clientId, clientSecret, projectId, and environment."
        );
      }
      return new InfisicalSecretsManager(new InfisicalSdkClient(options.infisical));
    case 'env':
      return new EnvSecretsManager(options.env);
    default:
      throw new Error(`Unknown secrets manager type: ${type}`);
  }
}

/**
 * Default secrets manager instance (environment-based).
 */
export const defaultSecretsManager = createSecretsManager();
