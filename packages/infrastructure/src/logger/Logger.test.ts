import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './Logger';
import type { Logger } from './Logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleOutput: string[] = [];

  beforeEach(() => {
    // Capture console output
    consoleOutput = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => {
      consoleOutput.push(str.toString());
      return true;
    });

    // Create logger without pretty printing for predictable test output
    logger = createLogger({ pretty: false, level: 'debug' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleOutput.some((line) => line.includes('Debug message'))).toBe(true);
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleOutput.some((line) => line.includes('Info message'))).toBe(true);
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(consoleOutput.some((line) => line.includes('Warning message'))).toBe(true);
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleOutput.some((line) => line.includes('Error message'))).toBe(true);
    });

    it('should log fatal messages', () => {
      logger.fatal('Fatal message');
      expect(consoleOutput.some((line) => line.includes('Fatal message'))).toBe(true);
    });
  });

  describe('context logging', () => {
    it('should include context in log output', () => {
      logger.info('User action', { userId: '123', action: 'login' });
      const output = consoleOutput.join('');
      expect(output).toContain('User action');
      expect(output).toContain('userId');
      expect(output).toContain('123');
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error, { operation: 'test' });
      const output = consoleOutput.join('');
      expect(output).toContain('Operation failed');
      expect(output).toContain('Test error');
    });
  });

  describe('child logger', () => {
    it('should create child logger with bindings', () => {
      const childLogger = logger.child({ requestId: 'req-123' });
      childLogger.info('Child log message');
      const output = consoleOutput.join('');
      expect(output).toContain('Child log message');
      expect(output).toContain('req-123');
    });

    it('should inherit parent context in child', () => {
      const child1 = logger.child({ service: 'api' });
      const child2 = child1.child({ component: 'auth' });
      child2.info('Nested child message');
      const output = consoleOutput.join('');
      expect(output).toContain('service');
      expect(output).toContain('component');
    });
  });

  describe('createLogger options', () => {
    it('should create logger with custom name', () => {
      const namedLogger = createLogger({ name: 'test-service', pretty: false });
      namedLogger.info('Named log');
      const output = consoleOutput.join('');
      expect(output).toContain('test-service');
    });

    it('should respect log level configuration', () => {
      const warnLogger = createLogger({ level: 'warn', pretty: false });
      warnLogger.debug('Should not appear');
      warnLogger.warn('Should appear');
      const output = consoleOutput.join('');
      expect(output).not.toContain('Should not appear');
      expect(output).toContain('Should appear');
    });
  });
});
