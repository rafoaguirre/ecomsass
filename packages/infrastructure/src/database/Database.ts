/**
 * Database transaction interface.
 */
export interface DatabaseTransaction {
  /**
   * Execute a query within the transaction.
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Commit the transaction.
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction.
   */
  rollback(): Promise<void>;
}

/**
 * Database connection interface for dependency injection.
 */
export interface Database {
  /**
   * Execute a query.
   * @param sql - The SQL query
   * @param params - Query parameters
   * @returns Array of results
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a query and return the first result.
   * @param sql - The SQL query
   * @param params - Query parameters
   * @returns First result or undefined
   */
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;

  /**
   * Execute a non-query command (INSERT, UPDATE, DELETE).
   * @param sql - The SQL command
   * @param params - Command parameters
   * @returns Number of affected rows
   */
  execute(sql: string, params?: unknown[]): Promise<number>;

  /**
   * Begin a transaction.
   * @returns Transaction object
   */
  beginTransaction(): Promise<DatabaseTransaction>;

  /**
   * Close the database connection.
   */
  close(): Promise<void>;
}

/**
 * In-memory database implementation for testing.
 */
export class InMemoryDatabase implements Database {
  private readonly store = new Map<string, unknown[]>();
  private closed = false;

  async query<T = unknown>(_sql: string, _params?: unknown[]): Promise<T[]> {
    this.checkClosed();
    // Stub implementation - would need actual SQL parsing for real usage
    return [];
  }

  async queryOne<T = unknown>(_sql: string, _params?: unknown[]): Promise<T | undefined> {
    this.checkClosed();
    const results = await this.query<T>(_sql, _params);
    return results[0];
  }

  async execute(_sql: string, _params?: unknown[]): Promise<number> {
    this.checkClosed();
    // Stub implementation
    return 0;
  }

  async beginTransaction(): Promise<DatabaseTransaction> {
    this.checkClosed();
    return new InMemoryTransaction();
  }

  async close(): Promise<void> {
    this.closed = true;
    this.store.clear();
  }

  private checkClosed(): void {
    if (this.closed) {
      throw new Error('Database connection is closed');
    }
  }
}

/**
 * In-memory transaction implementation.
 */
class InMemoryTransaction implements DatabaseTransaction {
  private committed = false;
  private rolledBack = false;

  async query<T = unknown>(_sql: string, _params?: unknown[]): Promise<T[]> {
    this.checkState();
    return [];
  }

  async commit(): Promise<void> {
    this.checkState();
    this.committed = true;
  }

  async rollback(): Promise<void> {
    this.checkState();
    this.rolledBack = true;
  }

  private checkState(): void {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }
    if (this.rolledBack) {
      throw new Error('Transaction already rolled back');
    }
  }
}

/**
 * Database configuration options.
 */
export interface DatabaseOptions {
  /**
   * The type of database.
   * @default 'memory'
   */
  type?: 'memory' | 'postgres' | 'mysql';

  /**
   * Connection string or configuration.
   */
  connectionString?: string;

  /**
   * Connection pool size.
   */
  poolSize?: number;
}

/**
 * Create a database connection based on configuration.
 */
export function createDatabase(options: DatabaseOptions = {}): Database {
  const type = options.type || 'memory';

  switch (type) {
    case 'memory':
      return new InMemoryDatabase();
    case 'postgres':
    case 'mysql':
      throw new Error(
        `Database type '${type}' is not yet implemented. ` +
          `Use type='memory' or implement a ${type} adapter.`
      );
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}
