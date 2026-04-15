import type { EmailSender, EmailMessage, EmailResult } from '@ecomsaas/application/ports';

/**
 * Console email sender — logs emails to stdout instead of sending.
 * Useful for local development and testing.
 */
export class ConsoleEmailSender implements EmailSender {
  private idCounter = 0;
  /** Sent messages kept in memory for test assertions. */
  readonly sent: Array<EmailMessage & { messageId: string }> = [];

  async send(message: EmailMessage): Promise<EmailResult> {
    const messageId = `console-${++this.idCounter}`;

    const to = Array.isArray(message.to) ? message.to : [message.to];
    const recipients = to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(', ');

    console.log(
      [
        '─── Email ───────────────────────────────────',
        `  To:      ${recipients}`,
        `  Subject: ${message.subject}`,
        message.from
          ? `  From:    ${message.from.name ? `${message.from.name} <${message.from.email}>` : message.from.email}`
          : null,
        message.replyTo ? `  Reply:   ${message.replyTo.email}` : null,
        message.tags?.length ? `  Tags:    ${message.tags.join(', ')}` : null,
        `  ID:      ${messageId}`,
        '─────────────────────────────────────────────',
        message.text ?? message.html,
        '─────────────────────────────────────────────',
      ]
        .filter(Boolean)
        .join('\n')
    );

    this.sent.push({ ...message, messageId });
    return { messageId };
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    for (const msg of messages) {
      results.push(await this.send(msg));
    }
    return results;
  }
}
