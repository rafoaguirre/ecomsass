import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage, StorageError, createStorage } from './Storage';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  it('should put and get objects', async () => {
    await storage.put('test.txt', 'Hello World', { contentType: 'text/plain' });

    const obj = await storage.get('test.txt');
    expect(obj).toBeDefined();
    expect(obj?.data.toString()).toBe('Hello World');
    expect(obj?.metadata.contentType).toBe('text/plain');
    expect(obj?.metadata.size).toBe(11);
  });

  it('should handle Buffer data', async () => {
    const buffer = Buffer.from('Binary data', 'utf-8');
    await storage.put('data.bin', buffer);

    const obj = await storage.get('data.bin');
    expect(obj?.data).toEqual(buffer);
  });

  it('should return undefined for non-existent objects', async () => {
    const obj = await storage.get('non-existent.txt');
    expect(obj).toBeUndefined();
  });

  it('should delete objects', async () => {
    await storage.put('test.txt', 'Hello');
    await storage.delete('test.txt');

    const obj = await storage.get('test.txt');
    expect(obj).toBeUndefined();
  });

  it('should check if object exists', async () => {
    await storage.put('test.txt', 'Hello');

    expect(await storage.exists('test.txt')).toBe(true);
    expect(await storage.exists('non-existent.txt')).toBe(false);
  });

  it('should list all objects', async () => {
    await storage.put('file1.txt', 'Content 1');
    await storage.put('file2.txt', 'Content 2');
    await storage.put('folder/file3.txt', 'Content 3');

    const keys = await storage.list();
    expect(keys).toHaveLength(3);
    expect(keys).toContain('file1.txt');
    expect(keys).toContain('file2.txt');
    expect(keys).toContain('folder/file3.txt');
  });

  it('should list objects with prefix', async () => {
    await storage.put('images/photo1.jpg', 'Photo 1');
    await storage.put('images/photo2.jpg', 'Photo 2');
    await storage.put('docs/file.pdf', 'Document');

    const imageKeys = await storage.list('images/');
    expect(imageKeys).toHaveLength(2);
    expect(imageKeys).toContain('images/photo1.jpg');
    expect(imageKeys).toContain('images/photo2.jpg');
  });

  it('should generate signed URLs', async () => {
    await storage.put('test.txt', 'Hello');

    const url = await storage.getSignedUrl('test.txt', 3600);
    expect(url).toBe('memory://test.txt');
  });

  it('should clear all objects', async () => {
    await storage.put('file1.txt', 'Content 1');
    await storage.put('file2.txt', 'Content 2');

    storage.clear();

    const keys = await storage.list();
    expect(keys).toHaveLength(0);
  });

  it('should throw StorageError for empty key', async () => {
    await expect(storage.put('', 'data')).rejects.toThrow(StorageError);
    await expect(storage.get('')).rejects.toThrow(StorageError);
    await expect(storage.delete('')).rejects.toThrow(StorageError);
    await expect(storage.exists('')).rejects.toThrow(StorageError);
  });

  it('should throw StorageError for non-string key', async () => {
    await expect(storage.put(null as any, 'data')).rejects.toThrow(StorageError);
    await expect(storage.put(null as any, 'data')).rejects.toThrow(
      'Storage key must be a non-empty string'
    );
  });

  it('should prevent mutation of stored buffer', async () => {
    const buffer = Buffer.from('original');
    await storage.put('test.bin', buffer);

    // Mutate the original buffer
    buffer.write('modified', 0);

    // Stored data should not be affected
    const obj = await storage.get('test.bin');
    expect(obj?.data.toString()).toBe('original');
  });

  it('should prevent mutation of returned buffer', async () => {
    await storage.put('test.bin', Buffer.from('original'));

    const obj1 = await storage.get('test.bin');
    obj1?.data.write('modified', 0);

    // Second get should return original data
    const obj2 = await storage.get('test.bin');
    expect(obj2?.data.toString()).toBe('original');
  });
});

describe('createStorage', () => {
  it('should create memory storage by default', async () => {
    const storage = createStorage();
    await storage.put('test.txt', 'Hello');
    const obj = await storage.get('test.txt');
    expect(obj?.data.toString()).toBe('Hello');
  });

  it('should create memory storage when specified', async () => {
    const storage = createStorage({ type: 'memory' });
    await storage.put('test.txt', 'Hello');
    const obj = await storage.get('test.txt');
    expect(obj?.data.toString()).toBe('Hello');
  });
});
