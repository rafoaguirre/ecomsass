import pino from 'pino';
import type { Logger as PinoLogger, LoggerOptions } from 'pino';

/**
 * Logger interface for dependency injection.
 * Abstracts the underlying logging implementation (Pino).
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
  fatal(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;

  /**
   * Create a child logger with additional context.
   */
  child(bindings: Record<string, unknown>): Logger;
}

/**
 * Pino-based logger implementation.
 */
export class PinoLoggerAdapter implements Logger {
  constructor(private readonly pinoLogger: PinoLogger) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    this.logWithError('error', message, error, context);
  }

  fatal(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    this.logWithError('fatal', message, error, context);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new PinoLoggerAdapter(this.pinoLogger.child(bindings));
  }

  /**
   * Helper method to reduce duplication in log methods.
   */
  private log(
    level: 'debug' | 'info' | 'warn',
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (context) {
      this.pinoLogger[level](context, message);
    } else {
      this.pinoLogger[level](message);
    }
  }

  /**
   * Helper method for error and fatal logs with error handling.
   */
  private logWithError(
    level: 'error' | 'fatal',
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const logContext = { ...context };

    if (error instanceof Error) {
      logContext.err = error;
    } else if (error) {
      logContext.error = error;
    }

    this.pinoLogger[level](logContext, message);
  }
}

/**
 * Logger configuration options.
 */
export interface CreateLoggerOptions {
  /**
   * Log level (trace, debug, info, warn, error, fatal)
   * @default 'info' in production, 'debug' in development
   */
  level?: string;

  /**
   * Pretty print logs (for development)
   * @default true if NODE_ENV !== 'production'
   */
  pretty?: boolean;

  /**
   * Service name to include in logs
   */
  name?: string;

  /**
   * Additional context to include in all logs
   */
  base?: Record<string, unknown>;
}

/**
 * Create a logger instance with optional configuration.
 */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const pinoOptions: LoggerOptions = {
    level: options.level || (isDevelopment ? 'debug' : 'info'),
    name: options.name,
    base: options.base,
  };

  // Add pretty printing for development
  if (options.pretty !== false && isDevelopment) {
    pinoOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  const pinoLogger = pino(pinoOptions);
  return new PinoLoggerAdapter(pinoLogger);
}

/**
 * Default logger instance for convenience (not recommended for testing).
 * Prefer dependency injection in production code.
 */
export const defaultLogger = createLogger();
