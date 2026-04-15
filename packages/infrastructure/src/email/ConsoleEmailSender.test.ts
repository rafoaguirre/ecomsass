import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleEmailSender } from './ConsoleEmailSender';
import type { EmailMessage } from '@ecomsaas/application/ports';

describe('ConsoleEmailSender', () => {
  let sender: ConsoleEmailSender;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sender = new ConsoleEmailSender();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should send a single email and return a message ID', async () => {
    const result = await sender.send({
      to: { email: 'test@example.com', name: 'Test User' },
      subject: 'Hello',
      html: '<p>World</p>',
    });

    expect(result.messageId).toBe('console-1');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]!.subject).toBe('Hello');
  });

  it('should handle multiple recipients', async () => {
    const msg: EmailMessage = {
      to: [{ email: 'a@example.com', name: 'A' }, { email: 'b@example.com' }],
      subject: 'Multi',
      html: '<p>Hi</p>',
    };

    const result = await sender.send(msg);
    expect(result.messageId).toBe('console-1');

    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('A <a@example.com>');
    expect(output).toContain('b@example.com');
  });

  it('should increment IDs across sends', async () => {
    const r1 = await sender.send({ to: { email: 'a@x.com' }, subject: '1', html: '' });
    const r2 = await sender.send({ to: { email: 'b@x.com' }, subject: '2', html: '' });

    expect(r1.messageId).toBe('console-1');
    expect(r2.messageId).toBe('console-2');
    expect(sender.sent).toHaveLength(2);
  });

  it('should log from, replyTo, and tags when provided', async () => {
    await sender.send({
      to: { email: 'test@example.com' },
      subject: 'Tagged',
      html: '<p>Content</p>',
      from: { email: 'sender@example.com', name: 'Sender' },
      replyTo: { email: 'reply@example.com' },
      tags: ['welcome', 'transactional'],
    });

    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('Sender <sender@example.com>');
    expect(output).toContain('reply@example.com');
    expect(output).toContain('welcome, transactional');
  });

  it('sendBatch should send all messages sequentially', async () => {
    const results = await sender.sendBatch([
      { to: { email: 'a@x.com' }, subject: '1', html: '' },
      { to: { email: 'b@x.com' }, subject: '2', html: '' },
      { to: { email: 'c@x.com' }, subject: '3', html: '' },
    ]);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.messageId)).toEqual(['console-1', 'console-2', 'console-3']);
    expect(sender.sent).toHaveLength(3);
  });
});
