import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabase, createDatabase } from './Database';
import type { Database } from './Database';

describe('InMemoryDatabase', () => {
  let db: Database;

  beforeEach(() => {
    db = new InMemoryDatabase();
  });

  it('should execute queries', async () => {
    const results = await db.query('SELECT * FROM users');
    expect(results).toEqual([]);
  });

  it('should execute queryOne', async () => {
    const result = await db.queryOne('SELECT * FROM users WHERE id = ?', [1]);
    expect(result).toBeUndefined();
  });

  it('should execute commands', async () => {
    const affectedRows = await db.execute('INSERT INTO users VALUES (?, ?)', [1, 'Test']);
    expect(affectedRows).toBe(0);
  });

  it('should begin transactions', async () => {
    const tx = await db.beginTransaction();
    expect(tx).toBeDefined();
    expect(tx.commit).toBeDefined();
    expect(tx.rollback).toBeDefined();
  });

  it('should commit transactions', async () => {
    const tx = await db.beginTransaction();
    await tx.query('INSERT INTO users VALUES (?, ?)', [1, 'Test']);
    await expect(tx.commit()).resolves.not.toThrow();
  });

  it('should rollback transactions', async () => {
    const tx = await db.beginTransaction();
    await tx.query('INSERT INTO users VALUES (?, ?)', [1, 'Test']);
    await expect(tx.rollback()).resolves.not.toThrow();
  });

  it('should throw on query after commit', async () => {
    const tx = await db.beginTransaction();
    await tx.commit();
    await expect(tx.query('SELECT * FROM users')).rejects.toThrow('already committed');
  });

  it('should throw on query after rollback', async () => {
    const tx = await db.beginTransaction();
    await tx.rollback();
    await expect(tx.query('SELECT * FROM users')).rejects.toThrow('already rolled back');
  });

  it('should close connection', async () => {
    await db.close();
    await expect(db.query('SELECT * FROM users')).rejects.toThrow('connection is closed');
  });
});

describe('createDatabase', () => {
  it('should create memory database by default', async () => {
    const db = createDatabase();
    const results = await db.query('SELECT * FROM test');
    expect(results).toEqual([]);
  });

  it('should create memory database when specified', async () => {
    const db = createDatabase({ type: 'memory' });
    const results = await db.query('SELECT * FROM test');
    expect(results).toEqual([]);
  });

  it('should throw for unimplemented postgres type', () => {
    expect(() => createDatabase({ type: 'postgres' })).toThrow(
      "Database type 'postgres' is not yet implemented"
    );
  });

  it('should throw for unimplemented mysql type', () => {
    expect(() => createDatabase({ type: 'mysql' })).toThrow(
      "Database type 'mysql' is not yet implemented"
    );
  });
});
