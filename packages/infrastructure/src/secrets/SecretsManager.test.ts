import { describe, it, expect, beforeEach } from 'vitest';
import {
  applySecretsToEnv,
  createSecretsManager,
  EnvSecretsManager,
  InfisicalSecretsManager,
  InMemorySecretsManager,
  preloadSecrets,
  SecretNotFoundError,
} from './SecretsManager';
import type { SecretsManager } from './SecretsManager';

describe('EnvSecretsManager', () => {
  let manager: SecretsManager;
  const mockEnv: Record<string, string | undefined> = {
    API_KEY: 'test-api-key',
    DATABASE_URL: 'postgres://localhost',
  };

  beforeEach(() => {
    manager = new EnvSecretsManager(mockEnv);
  });

  it('should get existing secret', async () => {
    const value = await manager.get('API_KEY');
    expect(value).toBe('test-api-key');
  });

  it('should return undefined for non-existent secret', async () => {
    const value = await manager.get('NON_EXISTENT');
    expect(value).toBeUndefined();
  });

  it('should get required secret', async () => {
    const value = await manager.getRequired('DATABASE_URL');
    expect(value).toBe('postgres://localhost');
  });

  it('should throw SecretNotFoundError for missing required secret', async () => {
    await expect(manager.getRequired('MISSING_KEY')).rejects.toThrow(SecretNotFoundError);
  });

  it('should check if secret exists', async () => {
    expect(await manager.has('API_KEY')).toBe(true);
    expect(await manager.has('MISSING')).toBe(false);
  });

  it('should set secret', async () => {
    await manager.set('NEW_KEY', 'new-value');
    const value = await manager.get('NEW_KEY');
    expect(value).toBe('new-value');
  });

  it('should cache secrets after first access', async () => {
    // First access
    await manager.get('API_KEY');

    // Modify env directly (shouldn't affect cached value)
    mockEnv.API_KEY = 'modified-key';

    // Should return cached value
    const value = await manager.get('API_KEY');
    expect(value).toBe('test-api-key');
  });
});

describe('InMemorySecretsManager', () => {
  let manager: InMemorySecretsManager;

  beforeEach(() => {
    manager = new InMemorySecretsManager();
  });

  it('should get and set secrets', async () => {
    await manager.set('TEST_KEY', 'test-value');
    const value = await manager.get('TEST_KEY');
    expect(value).toBe('test-value');
  });

  it('should return undefined for non-existent secret', async () => {
    const value = await manager.get('NON_EXISTENT');
    expect(value).toBeUndefined();
  });

  it('should throw for missing required secret', async () => {
    await expect(manager.getRequired('MISSING')).rejects.toThrow(SecretNotFoundError);
  });

  it('should check if secret exists', async () => {
    await manager.set('KEY', 'value');
    expect(await manager.has('KEY')).toBe(true);
    expect(await manager.has('MISSING')).toBe(false);
  });

  it('should clear all secrets', async () => {
    await manager.set('KEY1', 'value1');
    await manager.set('KEY2', 'value2');

    manager.clear();

    expect(await manager.has('KEY1')).toBe(false);
    expect(await manager.has('KEY2')).toBe(false);
  });
});

describe('createSecretsManager', () => {
  it('should create env-based manager by default', async () => {
    const manager = createSecretsManager({
      env: { TEST: 'value' },
    });

    const value = await manager.get('TEST');
    expect(value).toBe('value');
  });

  it('should create memory-based manager when specified', async () => {
    const manager = createSecretsManager({ type: 'memory' });
    await manager.set('KEY', 'value');
    const value = await manager.get('KEY');
    expect(value).toBe('value');
  });

  it('should throw when infisical manager is missing config and client', () => {
    expect(() => createSecretsManager({ type: 'infisical' })).toThrow(
      "Missing 'infisical' config for type='infisical'"
    );
  });

  it('should create infisical manager using custom client override', async () => {
    const manager = createSecretsManager({
      type: 'infisical',
      infisicalClient: {
        async getSecret(key: string) {
          return key === 'API_KEY' ? 'from-client' : undefined;
        },
      },
    });

    expect(await manager.get('API_KEY')).toBe('from-client');
  });
});

describe('InfisicalSecretsManager', () => {
  it('should fetch from client and cache values', async () => {
    let calls = 0;
    const manager = new InfisicalSecretsManager({
      async getSecret(key: string) {
        calls++;
        return key === 'API_KEY' ? 'from-infisical' : undefined;
      },
    });

    expect(await manager.get('API_KEY')).toBe('from-infisical');
    expect(await manager.get('API_KEY')).toBe('from-infisical');
    expect(calls).toBe(1);
  });
});

describe('preloadSecrets', () => {
  it('should preload required keys and optionally attach to env', async () => {
    const manager = new InMemorySecretsManager();
    await manager.set('A', '1');
    await manager.set('B', '2');

    const targetEnv: Record<string, string | undefined> = { B: 'existing' };

    const resolved = await preloadSecrets(manager, ['A', 'B'], {
      attachToEnv: true,
      env: targetEnv,
      overwriteExisting: false,
    });

    expect(resolved).toEqual({ A: '1', B: '2' });
    expect(targetEnv.A).toBe('1');
    expect(targetEnv.B).toBe('existing');
  });
});

describe('applySecretsToEnv', () => {
  it('should overwrite existing values when enabled', () => {
    const env: Record<string, string | undefined> = { A: 'old' };

    applySecretsToEnv({ A: 'new' }, { env, overwriteExisting: true });

    expect(env.A).toBe('new');
  });
});
