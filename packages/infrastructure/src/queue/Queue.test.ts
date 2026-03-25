import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryQueue, QueueError, createQueue } from './Queue';

describe('InMemoryQueue', () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue();
  });

  it('should send and receive messages', async () => {
    const messageId = await queue.send({ text: 'Hello' });
    expect(messageId).toBeTruthy();

    const messages = await queue.receive(1);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.data).toEqual({ text: 'Hello' });
  });

  it('should respect maxMessages limit', async () => {
    await queue.send({ text: 'Message 1' });
    await queue.send({ text: 'Message 2' });
    await queue.send({ text: 'Message 3' });

    const messages = await queue.receive(2);
    expect(messages).toHaveLength(2);
  });

  it('should delete messages', async () => {
    const messageId = await queue.send({ text: 'Hello' });
    await queue.delete(messageId);

    const size = await queue.size();
    expect(size).toBe(0);
  });

  it('should track message attempts', async () => {
    await queue.send({ text: 'Hello' });

    const messages1 = await queue.receive(1, 0); // 0 visibility timeout
    expect(messages1[0]?.attempts).toBe(1);

    const messages2 = await queue.receive(1, 0);
    expect(messages2[0]?.attempts).toBe(2);
  });

  it('should handle delayed messages', async () => {
    vi.useFakeTimers();

    await queue.send({ text: 'Delayed' }, 5); // 5 seconds delay

    // Try to receive immediately
    let messages = await queue.receive(1);
    expect(messages).toHaveLength(0);

    // Advance time
    vi.advanceTimersByTime(6000);

    messages = await queue.receive(1);
    expect(messages).toHaveLength(1);

    vi.useRealTimers();
  });

  it('should respect visibility timeout', async () => {
    vi.useFakeTimers();

    await queue.send({ text: 'Hello' });

    // Receive with 5 second visibility timeout
    const messages1 = await queue.receive(1, 5);
    expect(messages1).toHaveLength(1);

    // Try to receive again immediately (should be hidden)
    const messages2 = await queue.receive(1, 5);
    expect(messages2).toHaveLength(0);

    // Advance time past visibility timeout
    vi.advanceTimersByTime(6000);

    // Should be visible again
    const messages3 = await queue.receive(1, 5);
    expect(messages3).toHaveLength(1);

    vi.useRealTimers();
  });

  it('should get queue size', async () => {
    await queue.send({ text: 'Message 1' });
    await queue.send({ text: 'Message 2' });

    const size = await queue.size();
    expect(size).toBe(2);
  });

  it('should clear all messages', async () => {
    await queue.send({ text: 'Message 1' });
    await queue.send({ text: 'Message 2' });

    await queue.clear();

    const size = await queue.size();
    expect(size).toBe(0);
  });

  it('should throw QueueError for negative delay', async () => {
    await expect(queue.send({ text: 'test' }, -1)).rejects.toThrow(QueueError);
    await expect(queue.send({ text: 'test' }, -1)).rejects.toThrow(
      'Delay must be a non-negative number'
    );
  });

  it('should throw QueueError for invalid maxMessages', async () => {
    await expect(queue.receive(0)).rejects.toThrow(QueueError);
    await expect(queue.receive(-1)).rejects.toThrow('maxMessages must be at least 1');
  });

  it('should throw QueueError for negative visibilityTimeout', async () => {
    await expect(queue.receive(1, -1)).rejects.toThrow(QueueError);
    await expect(queue.receive(1, -5)).rejects.toThrow('visibilityTimeout must be non-negative');
  });
});

describe('createQueue', () => {
  it('should create memory queue by default', async () => {
    const queue = createQueue();
    const messageId = await queue.send({ test: 'data' });
    expect(messageId).toBeTruthy();
  });
});
