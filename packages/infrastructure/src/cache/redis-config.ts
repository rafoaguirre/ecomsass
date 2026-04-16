/**
 * Parsed Redis connection configuration.
 */
export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  username?: string;
  /** Original URL if provided. */
  url?: string;
}

/**
 * Parse a Redis URL into a structured connection config.
 *
 * Supports `redis://` and `rediss://` schemes.
 * Returns host, port, password, db, and username extracted from the URL.
 *
 * @throws {Error} If the URL cannot be parsed.
 */
export function parseRedisUrl(url: string): RedisConnectionConfig {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid Redis URL "${url}" — cannot parse as URL`);
  }

  const port = Number(parsed.port) || 6379;
  const dbSegment = parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined;

  return {
    url,
    host: parsed.hostname,
    port,
    password: parsed.password || undefined,
    db: dbSegment !== undefined && !Number.isNaN(dbSegment) ? dbSegment : undefined,
    username: parsed.username || undefined,
  };
}

/**
 * Validate and parse a Redis port string.
 *
 * @throws {Error} If the port is not a valid number between 1 and 65535.
 */
export function parseRedisPort(portRaw: string): number {
  const port = Number(portRaw);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid Redis port "${portRaw}" — must be a number between 1 and 65535`);
  }
  return port;
}
