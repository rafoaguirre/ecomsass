/**
 * Queue message interface.
 */
export interface QueueMessage<T = unknown> {
  id: string;
  data: T;
  timestamp: number;
  attempts: number;
}

/**
 * Queue error for validation failures.
 */
export class QueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueError';
  }
}

/**
 * Queue interface for dependency injection.
 */
export interface Queue {
  /**
   * Send a message to the queue.
   * @param data - The message data
   * @param delay - Optional delay in seconds before the message is available
   */
  send<T = unknown>(data: T, delay?: number): Promise<string>;

  /**
   * Receive messages from the queue.
   * @param maxMessages - Maximum number of messages to receive
   * @param visibilityTimeout - Time in seconds before message becomes visible again
   * @returns Array of messages
   */
  receive<T = unknown>(
    maxMessages?: number,
    visibilityTimeout?: number
  ): Promise<QueueMessage<T>[]>;

  /**
   * Delete a message from the queue.
   * @param messageId - The message ID
   */
  delete(messageId: string): Promise<void>;

  /**
   * Get the approximate number of messages in the queue.
   */
  size(): Promise<number>;

  /**
   * Clear all messages from the queue.
   */
  clear(): Promise<void>;
}

/**
 * In-memory queue implementation using array.
 * Suitable for single-instance applications or testing.
 */
export class InMemoryQueue implements Queue {
  private messages: Array<QueueMessage & { visibleAt: number }> = [];
  private messageIdCounter = 0;

  async send<T = unknown>(data: T, delay = 0): Promise<string> {
    if (delay < 0) {
      throw new QueueError('Delay must be a non-negative number');
    }

    const id = `msg-${++this.messageIdCounter}`;
    const message = {
      id,
      data,
      timestamp: Date.now(),
      attempts: 0,
      visibleAt: Date.now() + delay * 1000,
    };

    this.messages.push(message);
    return id;
  }

  async receive<T = unknown>(maxMessages = 1, visibilityTimeout = 30): Promise<QueueMessage<T>[]> {
    if (maxMessages < 1) {
      throw new QueueError('maxMessages must be at least 1');
    }
    if (visibilityTimeout < 0) {
      throw new QueueError('visibilityTimeout must be non-negative');
    }

    const now = Date.now();
    const availableMessages = this.messages.filter((m) => m.visibleAt <= now);

    const messagesToReturn = availableMessages.slice(0, maxMessages);

    // Update visibility timeout for returned messages
    for (const msg of messagesToReturn) {
      msg.visibleAt = now + visibilityTimeout * 1000;
      msg.attempts++;
    }

    return messagesToReturn.map((m) => ({
      id: m.id,
      data: m.data as T,
      timestamp: m.timestamp,
      attempts: m.attempts,
    }));
  }

  async delete(messageId: string): Promise<void> {
    this.messages = this.messages.filter((m) => m.id !== messageId);
  }

  async size(): Promise<number> {
    return this.messages.length;
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}

/**
 * Queue configuration options.
 */
export interface QueueOptions {
  /**
   * The type of queue to use.
   * @default 'memory'
   */
  type?: 'memory';

  /**
   * Queue name (for external queue services).
   */
  name?: string;
}

/**
 * Create a queue instance based on configuration.
 */
export function createQueue(options: QueueOptions = {}): Queue {
  const type = options.type || 'memory';

  switch (type) {
    case 'memory':
    default:
      return new InMemoryQueue();
  }
}
