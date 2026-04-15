import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResendEmailSender, EmailError } from './ResendEmailSender';

describe('ResendEmailSender', () => {
  let sender: ResendEmailSender;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sender = new ResendEmailSender({
      apiKey: 're_test_key',
      defaultFrom: { email: 'noreply@test.com', name: 'Test App' },
    });
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should send an email with correct headers and body', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ id: 'msg_123' }), { status: 200 }));

    const result = await sender.send({
      to: { email: 'user@example.com', name: 'User' },
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
      replyTo: { email: 'reply@example.com' },
      tags: ['welcome'],
    });

    expect(result.messageId).toBe('msg_123');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init!.method).toBe('POST');
    expect(init!.headers).toEqual({
      Authorization: 'Bearer re_test_key',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(init!.body as string);
    expect(body.from).toBe('Test App <noreply@test.com>');
    expect(body.to).toEqual(['User <user@example.com>']);
    expect(body.subject).toBe('Test Subject');
    expect(body.html).toBe('<p>Hello</p>');
    expect(body.text).toBe('Hello');
    expect(body.reply_to).toBe('reply@example.com');
    expect(body.tags).toEqual([{ name: 'welcome', value: 'true' }]);
  });

  it('should use per-message from when provided', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ id: 'msg_456' }), { status: 200 }));

    await sender.send({
      to: { email: 'user@example.com' },
      subject: 'Override',
      html: '',
      from: { email: 'custom@example.com', name: 'Custom Sender' },
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.from).toBe('Custom Sender <custom@example.com>');
  });

  it('should throw EmailError on API failure', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid API key' }), { status: 401 })
    );

    await expect(
      sender.send({
        to: { email: 'user@example.com' },
        subject: 'Fail',
        html: '',
      })
    ).rejects.toThrow(EmailError);
  });

  it('should handle non-JSON error responses', async () => {
    fetchSpy.mockResolvedValue(
      new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
    );

    await expect(
      sender.send({
        to: { email: 'user@example.com' },
        subject: 'Fail',
        html: '',
      })
    ).rejects.toThrow('Resend API error (500)');
  });

  it('should support custom baseUrl', async () => {
    const customSender = new ResendEmailSender({
      apiKey: 're_test',
      defaultFrom: { email: 'no@test.com' },
      baseUrl: 'https://custom.api.example.com',
    });

    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ id: 'msg_789' }), { status: 200 }));

    await customSender.send({
      to: { email: 'user@example.com' },
      subject: 'Custom',
      html: '',
    });

    expect(fetchSpy.mock.calls[0][0]).toBe('https://custom.api.example.com/emails');
  });

  describe('sendBatch', () => {
    it('should send batch request to /emails/batch', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: 'b_1' }, { id: 'b_2' }] }), { status: 200 })
      );

      const results = await sender.sendBatch([
        { to: { email: 'a@x.com' }, subject: 'A', html: '<p>A</p>' },
        { to: { email: 'b@x.com' }, subject: 'B', html: '<p>B</p>' },
      ]);

      expect(results).toEqual([{ messageId: 'b_1' }, { messageId: 'b_2' }]);
      expect(fetchSpy.mock.calls[0][0]).toBe('https://api.resend.com/emails/batch');
    });

    it('should throw EmailError on batch API failure', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ message: 'Rate limited' }), { status: 429 })
      );

      await expect(
        sender.sendBatch([{ to: { email: 'a@x.com' }, subject: 'X', html: '' }])
      ).rejects.toThrow(EmailError);
    });
  });
});
