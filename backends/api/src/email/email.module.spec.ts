import { describe, expect, it, vi, beforeEach } from 'vitest';

// Inline mocks — avoid importing NestJS DI internals
function createMockEmailSender() {
  return {
    send: vi.fn().mockResolvedValue({ messageId: 'test-1' }),
    sendBatch: vi.fn().mockResolvedValue([{ messageId: 'test-1' }]),
  };
}

function createMockQueue() {
  const handlers = new Map<string, (job: any) => Promise<void>>();
  return {
    add: vi.fn().mockResolvedValue('job-1'),
    process: vi.fn((name: string, handler: (job: any) => Promise<void>) => {
      handlers.set(name, handler);
    }),
    size: vi.fn().mockResolvedValue(0),
    clear: vi.fn(),
    close: vi.fn(),
    _handlers: handlers,
  };
}

// Import after mocks
import { EmailModule, EMAIL_JOBS } from './email.module';

describe('EmailModule', () => {
  let emailSender: ReturnType<typeof createMockEmailSender>;
  let queue: ReturnType<typeof createMockQueue>;
  let emailModule: EmailModule;

  beforeEach(() => {
    emailSender = createMockEmailSender();
    queue = createMockQueue();
    emailModule = new EmailModule(emailSender as any, queue as any);
  });

  it('should register all email job handlers on init', async () => {
    await emailModule.onModuleInit();

    expect(queue.process).toHaveBeenCalledTimes(3);
    expect(queue.process).toHaveBeenCalledWith(EMAIL_JOBS.SEND, expect.any(Function));
    expect(queue.process).toHaveBeenCalledWith(EMAIL_JOBS.ORDER_CONFIRMATION, expect.any(Function));
    expect(queue.process).toHaveBeenCalledWith(
      EMAIL_JOBS.ORDER_STATUS_UPDATE,
      expect.any(Function)
    );
  });

  it('should send email via generic SEND handler', async () => {
    await emailModule.onModuleInit();

    const handler = queue._handlers.get(EMAIL_JOBS.SEND)!;
    await handler({
      id: 'j1',
      name: EMAIL_JOBS.SEND,
      data: {
        to: { email: 'test@example.com' },
        subject: 'Hello',
        html: '<p>Hi</p>',
      },
      attempts: 1,
      timestamp: Date.now(),
    });

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Hello' }));
  });

  it('should send order confirmation email', async () => {
    await emailModule.onModuleInit();

    const handler = queue._handlers.get(EMAIL_JOBS.ORDER_CONFIRMATION)!;
    await handler({
      id: 'j2',
      name: EMAIL_JOBS.ORDER_CONFIRMATION,
      data: {
        customerEmail: 'buyer@example.com',
        customerName: 'Jane',
        orderRef: 'ORD-123',
        totalFormatted: '$100.00',
        items: [{ name: 'Widget', quantity: 1, priceFormatted: '$100.00' }],
        idempotencyKey: 'order-confirm-ORD-123',
      },
      attempts: 1,
      timestamp: Date.now(),
    });

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    const sentMsg = emailSender.send.mock.calls[0]![0];
    expect(sentMsg.subject).toContain('ORD-123');
    expect(sentMsg.html).toContain('Order Confirmed');
    expect(sentMsg.to).toEqual({ email: 'buyer@example.com', name: 'Jane' });
    expect(sentMsg.tags).toContain('order-confirmation');
  });

  it('should skip duplicate order confirmation (idempotency)', async () => {
    await emailModule.onModuleInit();

    const handler = queue._handlers.get(EMAIL_JOBS.ORDER_CONFIRMATION)!;
    const job = {
      id: 'j3',
      name: EMAIL_JOBS.ORDER_CONFIRMATION,
      data: {
        customerEmail: 'buyer@example.com',
        customerName: 'Jane',
        orderRef: 'ORD-DEDUP',
        totalFormatted: '$50.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$50.00' }],
        idempotencyKey: 'dedup-key-123',
      },
      attempts: 1,
      timestamp: Date.now(),
    };

    // First call should send
    await handler(job);
    expect(emailSender.send).toHaveBeenCalledTimes(1);

    // Second call with same key should be skipped
    await handler(job);
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('should send order status update email', async () => {
    await emailModule.onModuleInit();

    const handler = queue._handlers.get(EMAIL_JOBS.ORDER_STATUS_UPDATE)!;
    await handler({
      id: 'j4',
      name: EMAIL_JOBS.ORDER_STATUS_UPDATE,
      data: {
        customerEmail: 'buyer@example.com',
        customerName: 'John',
        orderRef: 'ORD-456',
        previousStatus: 'Processing',
        newStatus: 'Shipped',
        message: 'Tracking: ABC123',
        idempotencyKey: 'status-ORD-456-shipped',
      },
      attempts: 1,
      timestamp: Date.now(),
    });

    expect(emailSender.send).toHaveBeenCalledTimes(1);
    const sentMsg = emailSender.send.mock.calls[0]![0];
    expect(sentMsg.subject).toContain('Shipped');
    expect(sentMsg.html).toContain('Order Update');
    expect(sentMsg.html).toContain('Shipped');
    expect(sentMsg.tags).toContain('order-status-update');
  });

  it('should skip duplicate order status update', async () => {
    await emailModule.onModuleInit();

    const handler = queue._handlers.get(EMAIL_JOBS.ORDER_STATUS_UPDATE)!;
    const job = {
      id: 'j5',
      name: EMAIL_JOBS.ORDER_STATUS_UPDATE,
      data: {
        customerEmail: 'buyer@example.com',
        customerName: 'John',
        orderRef: 'ORD-789',
        previousStatus: 'Pending',
        newStatus: 'Confirmed',
        idempotencyKey: 'status-dedup-789',
      },
      attempts: 1,
      timestamp: Date.now(),
    };

    await handler(job);
    expect(emailSender.send).toHaveBeenCalledTimes(1);

    await handler(job);
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });
});
