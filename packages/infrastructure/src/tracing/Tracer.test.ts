import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NoOpTracer, ConsoleTracer, createTracer } from './Tracer';
import type { Tracer } from './Tracer';

describe('NoOpTracer', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new NoOpTracer();
  });

  it('should start and end spans without errors', () => {
    const span = tracer.startSpan('test-span');
    expect(span).toBeDefined();

    span.setAttribute('key', 'value');
    span.addEvent('event');
    span.recordError(new Error('Test error'));
    span.setStatus('error');
    span.end();

    // No assertions - just ensuring no errors thrown
  });

  it('should execute function within trace', async () => {
    const result = await tracer.trace('test-operation', async (span) => {
      span.setAttribute('test', 'value');
      return 42;
    });

    expect(result).toBe(42);
  });
});

describe('ConsoleTracer', () => {
  let tracer: Tracer;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tracer = new ConsoleTracer();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should start span with attributes', () => {
    const span = tracer.startSpan('test-span', { userId: 123, action: 'create' });
    span.end();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-span'),
      expect.objectContaining({
        attributes: expect.objectContaining({
          userId: 123,
          action: 'create',
        }),
      })
    );
  });

  it('should record attributes and events', () => {
    const span = tracer.startSpan('test-span');
    span.setAttribute('key1', 'value1');
    span.setAttributes({ key2: 'value2', key3: 123 });
    span.addEvent('user-action', { action: 'click' });
    span.end();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-span'),
      expect.objectContaining({
        attributes: expect.objectContaining({
          key1: 'value1',
          key2: 'value2',
          key3: 123,
        }),
        events: expect.arrayContaining([
          expect.objectContaining({
            name: 'user-action',
            attributes: { action: 'click' },
          }),
        ]),
      })
    );
  });

  it('should record errors', () => {
    const span = tracer.startSpan('test-span');
    span.recordError(new Error('Test error'));
    span.end();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[error]'),
      expect.objectContaining({
        attributes: expect.objectContaining({
          error: 'Test error',
        }),
      })
    );
  });

  it('should trace successful operations', async () => {
    const result = await tracer.trace('successful-operation', async (span) => {
      span.setAttribute('processed', 100);
      return 'success';
    });

    expect(result).toBe('success');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[ok]'), expect.any(Object));
  });

  it('should trace failed operations', async () => {
    await expect(
      tracer.trace('failed-operation', async (span) => {
        span.setAttribute('attempted', true);
        throw new Error('Operation failed');
      })
    ).rejects.toThrow('Operation failed');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[error]'),
      expect.objectContaining({
        attributes: expect.objectContaining({
          error: 'Operation failed',
        }),
      })
    );
  });
});

describe('createTracer', () => {
  it('should create noop tracer by default', () => {
    const tracer = createTracer();
    expect(tracer).toBeInstanceOf(NoOpTracer);
  });

  it('should create console tracer when specified', () => {
    const tracer = createTracer({ type: 'console' });
    expect(tracer).toBeInstanceOf(ConsoleTracer);
  });

  it('should create noop tracer when specified', () => {
    const tracer = createTracer({ type: 'noop' });
    expect(tracer).toBeInstanceOf(NoOpTracer);
  });

  it('should throw for unimplemented otel type', () => {
    expect(() => createTracer({ type: 'otel' })).toThrow(
      "Tracer type 'otel' is not yet implemented"
    );
  });
});
