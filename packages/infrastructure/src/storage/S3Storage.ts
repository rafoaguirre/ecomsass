import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Storage, StorageMetadata, StorageObject } from './Storage';
import { StorageError } from './Storage';

export interface S3StorageOptions {
  /** S3/MinIO bucket name. */
  bucket: string;
  /** AWS region or MinIO region placeholder. @default 'us-east-1' */
  region?: string;
  /** Custom endpoint URL — required for MinIO or other S3-compatible stores. */
  endpoint?: string;
  /** AWS access key ID (optional if using instance/environment credentials). */
  accessKeyId?: string;
  /** AWS secret access key (optional if using instance/environment credentials). */
  secretAccessKey?: string;
  /** Use path-style URLs — required for MinIO. @default false */
  forcePathStyle?: boolean;
  /**
   * Public base URL returned in signed URLs for public objects.
   * When set, `getSignedUrl` returns `${publicBaseUrl}/${key}` for non-expiring access.
   * Omit to use the AWS SDK `getSignedUrl` helper instead.
   */
  publicBaseUrl?: string;
  /** Default presigned URL expiry in seconds. @default 3600 */
  defaultExpiresInSeconds?: number;
}

/**
 * S3-compatible storage adapter.
 *
 * Works with AWS S3, MinIO, and any S3-compatible object store.
 * Implements the `Storage` interface for dependency injection.
 *
 * @example
 * ```typescript
 * // MinIO (local dev)
 * const storage = new S3Storage({
 *   bucket: 'ecomsaas-dev',
 *   endpoint: 'http://localhost:9000',
 *   accessKeyId: 'minioadmin',
 *   secretAccessKey: 'minioadmin',
 *   forcePathStyle: true,
 * });
 *
 * // AWS S3 (production — credentials from environment/instance role)
 * const storage = new S3Storage({
 *   bucket: 'ecomsaas-prod',
 *   region: 'us-east-1',
 * });
 * ```
 */
export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | undefined;
  private readonly defaultExpiry: number;

  constructor(options: S3StorageOptions) {
    if (!options.bucket) {
      throw new StorageError('S3Storage requires a bucket name');
    }

    this.bucket = options.bucket;
    this.publicBaseUrl = options.publicBaseUrl;
    this.defaultExpiry = options.defaultExpiresInSeconds ?? 3600;

    const credentials =
      options.accessKeyId && options.secretAccessKey
        ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
        : undefined;

    this.client = new S3Client({
      region: options.region ?? 'us-east-1',
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      ...(credentials ? { credentials } : {}),
      forcePathStyle: options.forcePathStyle ?? false,
    });
  }

  async put(key: string, data: Buffer | string, metadata: StorageMetadata = {}): Promise<void> {
    this.validateKey(key);
    const body = typeof data === 'string' ? Buffer.from(data) : data;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: metadata.contentType,
        })
      );
    } catch (error) {
      throw new StorageError(`Failed to upload object "${key}": ${String(error)}`);
    }
  }

  async get(key: string): Promise<StorageObject | undefined> {
    this.validateKey(key);

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );

      if (!response.Body) {
        return undefined;
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);

      return {
        key,
        data,
        metadata: {
          contentType: response.ContentType,
          size: response.ContentLength,
          lastModified: response.LastModified,
        },
      };
    } catch (error) {
      const err = error as { name?: string };
      if (err.name === 'NoSuchKey') {
        return undefined;
      }
      throw new StorageError(`Failed to download object "${key}": ${String(error)}`);
    }
  }

  async delete(key: string): Promise<void> {
    this.validateKey(key);

    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      throw new StorageError(`Failed to delete object "${key}": ${String(error)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    this.validateKey(key);

    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      const err = error as { name?: string };
      if (err.name === 'NotFound' || err.name === 'NoSuchKey') {
        return false;
      }
      throw new StorageError(`Failed to check object "${key}": ${String(error)}`);
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        })
      );

      return (response.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((key): key is string => key !== undefined);
    } catch (error) {
      throw new StorageError(`Failed to list objects: ${String(error)}`);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    this.validateKey(key);

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${key}`;
    }

    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds ?? this.defaultExpiry,
      });
    } catch (error) {
      throw new StorageError(`Failed to generate signed URL for "${key}": ${String(error)}`);
    }
  }

  /**
   * Generate a presigned upload URL for direct client-to-S3 uploads.
   * Not part of the Storage interface — call explicitly when needed.
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<string> {
    this.validateKey(key);

    try {
      const { getSignedUrl: buildUrl } = await import('@aws-sdk/s3-request-presigner');
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      return await buildUrl(this.client, command, {
        expiresIn: expiresInSeconds ?? this.defaultExpiry,
      });
    } catch (error) {
      throw new StorageError(
        `Failed to generate presigned upload URL for "${key}": ${String(error)}`
      );
    }
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new StorageError('Storage key must be a non-empty string');
    }
  }
}
