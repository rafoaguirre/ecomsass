/**
 * Span interface for distributed tracing.
 */
export interface Span {
  /**
   * Set an attribute on the span.
   * @param key - Attribute key
   * @param value - Attribute value
   */
  setAttribute(key: string, value: string | number | boolean): void;

  /**
   * Set multiple attributes at once.
   * @param attributes - Object with attributes
   */
  setAttributes(attributes: Record<string, string | number | boolean>): void;

  /**
   * Add an event to the span.
   * @param name - Event name
   * @param attributes - Optional event attributes
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;

  /**
   * Record an error on the span.
   * @param error - Error object or message
   */
  recordError(error: Error | string): void;

  /**
   * Set the span status.
   * @param status - Status code (ok, error, unset)
   */
  setStatus(status: 'ok' | 'error' | 'unset'): void;

  /**
   * End the span.
   */
  end(): void;
}

/**
 * Tracer interface for dependency injection.
 */
export interface Tracer {
  /**
   * Start a new span.
   * @param name - Span name
   * @param attributes - Optional initial attributes
   * @returns Span instance
   */
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span;

  /**
   * Execute a function within a span context.
   * @param name - Span name
   * @param fn - Function to execute
   * @returns Result of the function
   */
  trace<T>(name: string, fn: (span: Span) => T | Promise<T>): Promise<T>;
}

/**
 * No-op span implementation (doesn't record anything).
 */
class NoOpSpan implements Span {
  setAttribute(_key: string, _value: string | number | boolean): void {
    // No-op
  }

  setAttributes(_attributes: Record<string, string | number | boolean>): void {
    // No-op
  }

  addEvent(_name: string, _attributes?: Record<string, string | number | boolean>): void {
    // No-op
  }

  recordError(_error: Error | string): void {
    // No-op
  }

  setStatus(_status: 'ok' | 'error' | 'unset'): void {
    // No-op
  }

  end(): void {
    // No-op
  }
}

/**
 * Console-based span for simple tracing.
 */
class ConsoleSpan implements Span {
  private attributes: Record<string, string | number | boolean> = {};
  private events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, string | number | boolean>;
  }> = [];
  private startTime = Date.now();
  private status: 'ok' | 'error' | 'unset' = 'unset';

  constructor(private readonly name: string) {}

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    Object.assign(this.attributes, attributes);
  }

  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  recordError(error: Error | string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    this.attributes.error = errorMessage;
    this.status = 'error';
  }

  setStatus(status: 'ok' | 'error' | 'unset'): void {
    this.status = status;
  }

  end(): void {
    const duration = Date.now() - this.startTime;
    console.log(`[Trace] ${this.name} (${duration}ms) [${this.status}]`, {
      attributes: this.attributes,
      events: this.events,
    });
  }
}

/**
 * No-op tracer implementation (doesn't record anything).
 */
export class NoOpTracer implements Tracer {
  startSpan(_name: string, _attributes?: Record<string, string | number | boolean>): Span {
    return new NoOpSpan();
  }

  async trace<T>(name: string, fn: (span: Span) => T | Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  }
}

/**
 * Console-based tracer for simple tracing.
 */
export class ConsoleTracer implements Tracer {
  startSpan(name: string, attributes?: Record<string, string | number | boolean>): Span {
    const span = new ConsoleSpan(name);
    if (attributes) {
      span.setAttributes(attributes);
    }
    return span;
  }

  async trace<T>(name: string, fn: (span: Span) => T | Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.recordError(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }
}

/**
 * Tracer configuration options.
 */
export interface TracerOptions {
  /**
   * The type of tracer.
   * @default 'noop'
   */
  type?: 'noop' | 'console' | 'otel';

  /**
   * Service name for tracing.
   */
  serviceName?: string;
}

/**
 * Create a tracer instance based on configuration.
 */
export function createTracer(options: TracerOptions = {}): Tracer {
  const type = options.type || 'noop';

  switch (type) {
    case 'console':
      return new ConsoleTracer();
    case 'noop':
      return new NoOpTracer();
    case 'otel':
      throw new Error(
        `Tracer type 'otel' is not yet implemented. ` +
          `Use type='console' or type='noop', or implement an OpenTelemetry adapter.`
      );
    default:
      throw new Error(`Unknown tracer type: ${type}`);
    // Future: Add OpenTelemetry implementation
  }
}

/**
 * Default no-op tracer instance.
 */
export const defaultTracer = createTracer();
