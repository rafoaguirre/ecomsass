/**
 * Storage metadata interface.
 */
export interface StorageMetadata {
  contentType?: string;
  size?: number;
  lastModified?: Date;
  [key: string]: unknown;
}

/**
 * Storage object interface.
 */
export interface StorageObject {
  key: string;
  data: Buffer;
  metadata: StorageMetadata;
}

/**
 * Storage error for validation failures.
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage interface for dependency injection.
 */
export interface Storage {
  /**
   * Upload an object to storage.
   * @param key - The object key/path
   * @param data - The object data (Buffer or string)
   * @param metadata - Optional metadata
   */
  put(key: string, data: Buffer | string, metadata?: StorageMetadata): Promise<void>;

  /**
   * Download an object from storage.
   * @param key - The object key/path
   * @returns The object data and metadata
   */
  get(key: string): Promise<StorageObject | undefined>;

  /**
   * Delete an object from storage.
   * @param key - The object key/path
   */
  delete(key: string): Promise<void>;

  /**
   * Check if an object exists.
   * @param key - The object key/path
   */
  exists(key: string): Promise<boolean>;

  /**
   * List objects with a given prefix.
   * @param prefix - The key prefix to filter by
   * @returns Array of object keys
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Get a signed URL for temporary access.
   * @param key - The object key/path
   * @param expiresInSeconds - URL expiration time
   * @returns Signed URL
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * In-memory storage implementation for testing.
 */
export class InMemoryStorage implements Storage {
  private readonly objects = new Map<string, StorageObject>();

  async put(key: string, data: Buffer | string, metadata: StorageMetadata = {}): Promise<void> {
    this.validateKey(key);
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;

    // Clone buffer to prevent external mutations
    const clonedBuffer = Buffer.from(buffer);

    this.objects.set(key, {
      key,
      data: clonedBuffer,
      metadata: {
        ...metadata,
        size: clonedBuffer.length,
        lastModified: new Date(),
      },
    });
  }

  async get(key: string): Promise<StorageObject | undefined> {
    this.validateKey(key);
    const obj = this.objects.get(key);

    if (!obj) {
      return undefined;
    }

    // Clone buffer to prevent external mutations
    return {
      ...obj,
      data: Buffer.from(obj.data),
      metadata: { ...obj.metadata },
    };
  }

  async delete(key: string): Promise<void> {
    this.validateKey(key);
    this.objects.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    this.validateKey(key);
    return this.objects.has(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.objects.keys());

    if (prefix) {
      return keys.filter((key) => key.startsWith(prefix));
    }

    return keys;
  }

  async getSignedUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    // Stub implementation - in real usage would generate actual signed URL
    return `memory://${key}`;
  }

  /**
   * Clear all objects (useful for testing).
   */
  clear(): void {
    this.objects.clear();
  }

  /**
   * Validate storage key.
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new StorageError('Storage key must be a non-empty string');
    }
  }
}

/**
 * Storage configuration options.
 */
export interface StorageOptions {
  /**
   * The type of storage.
   * @default 'memory'
   */
  type?: 'memory' | 's3' | 'gcs';

  /**
   * Bucket name (for cloud storage).
   */
  bucket?: string;

  /**
   * Region (for cloud storage).
   */
  region?: string;
}

/**
 * Create a storage instance based on configuration.
 */
export function createStorage(options: StorageOptions = {}): Storage {
  const type = options.type || 'memory';

  switch (type) {
    case 'memory':
    default:
      return new InMemoryStorage();
    // Future: Add S3, GCS implementations
  }
}
