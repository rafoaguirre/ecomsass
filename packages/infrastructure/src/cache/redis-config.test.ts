import { describe, it, expect } from 'vitest';
import { parseRedisUrl, parseRedisPort } from './redis-config';

describe('parseRedisUrl', () => {
  it('should parse full Redis URL', () => {
    const config = parseRedisUrl('redis://:secret@myhost:6380/2');
    expect(config.host).toBe('myhost');
    expect(config.port).toBe(6380);
    expect(config.password).toBe('secret');
    expect(config.db).toBe(2);
    expect(config.url).toBe('redis://:secret@myhost:6380/2');
  });

  it('should default port to 6379', () => {
    const config = parseRedisUrl('redis://localhost');
    expect(config.port).toBe(6379);
  });

  it('should parse username', () => {
    const config = parseRedisUrl('redis://admin:pass@host:6379');
    expect(config.username).toBe('admin');
    expect(config.password).toBe('pass');
  });

  it('should handle no db segment', () => {
    const config = parseRedisUrl('redis://localhost:6379');
    expect(config.db).toBeUndefined();
  });

  it('should ignore non-numeric db segment', () => {
    const config = parseRedisUrl('redis://localhost:6379/abc');
    expect(config.db).toBeUndefined();
  });

  it('should throw on invalid URL', () => {
    expect(() => parseRedisUrl('not-a-url')).toThrow('cannot parse as URL');
  });
});

describe('parseRedisPort', () => {
  it('should parse valid port', () => {
    expect(parseRedisPort('6379')).toBe(6379);
  });

  it('should throw on non-numeric', () => {
    expect(() => parseRedisPort('abc')).toThrow('Invalid Redis port');
  });

  it('should throw on zero', () => {
    expect(() => parseRedisPort('0')).toThrow('Invalid Redis port');
  });

  it('should throw on port > 65535', () => {
    expect(() => parseRedisPort('99999')).toThrow('Invalid Redis port');
  });

  it('should throw on negative', () => {
    expect(() => parseRedisPort('-1')).toThrow('Invalid Redis port');
  });
});
