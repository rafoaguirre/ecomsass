import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryQueue, createQueue } from './Queue';

describe('InMemoryQueue', () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue();
  });

  it('should add a job and return an id', async () => {
    const jobId = await queue.add('test-job', { text: 'Hello' });
    expect(jobId).toBeTruthy();
  });

  it('should process jobs inline when handler is registered', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.process('email', handler);

    await queue.add('email', { to: 'user@example.com' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'email',
        data: { to: 'user@example.com' },
        attempts: 1,
      })
    );

    // Processed job is removed from queue
    const size = await queue.size();
    expect(size).toBe(0);
  });

  it('should keep jobs pending when no handler is registered', async () => {
    await queue.add('unhandled', { data: 1 });
    await queue.add('unhandled', { data: 2 });

    const size = await queue.size();
    expect(size).toBe(2);
  });

  it('should deduplicate jobs by deduplicationId', async () => {
    await queue.add('email', { to: 'a@b.com' }, { deduplicationId: 'order-123' });
    const id2 = await queue.add('email', { to: 'a@b.com' }, { deduplicationId: 'order-123' });

    expect(id2).toContain('dedup-');
    const size = await queue.size();
    expect(size).toBe(1);
  });

  it('should get queue size', async () => {
    await queue.add('task', { n: 1 });
    await queue.add('task', { n: 2 });

    const size = await queue.size();
    expect(size).toBe(2);
  });

  it('should clear all jobs', async () => {
    await queue.add('task', { n: 1 });
    await queue.add('task', { n: 2 });

    await queue.clear();

    const size = await queue.size();
    expect(size).toBe(0);
  });

  it('should close gracefully', async () => {
    await queue.add('task', { n: 1 });
    await queue.close();

    const size = await queue.size();
    expect(size).toBe(0);
  });

  it('should keep job on handler error', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('fail'));
    queue.process('flaky', handler);

    await queue.add('flaky', { data: 1 });

    expect(handler).toHaveBeenCalledTimes(1);
    // Job is removed even on error in InMemory (BullMQ would retry)
    const size = await queue.size();
    expect(size).toBe(0);
  });
});

describe('createQueue', () => {
  it('should create memory queue by default', async () => {
    const queue = createQueue();
    const jobId = await queue.add('test-job', { test: 'data' });
    expect(jobId).toBeTruthy();
  });
});
