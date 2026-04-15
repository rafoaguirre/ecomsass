import type {
  EmailSender,
  EmailMessage,
  EmailResult,
  EmailAddress,
} from '@ecomsaas/application/ports';

/**
 * Configuration for the Resend email adapter.
 */
export interface ResendEmailConfig {
  /** Resend API key. */
  apiKey: string;
  /** Default "from" address when not specified per-message. */
  defaultFrom: EmailAddress;
  /** Resend API base URL (override for testing). @default 'https://api.resend.com' */
  baseUrl?: string;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  statusCode: number;
  message: string;
  name: string;
}

/**
 * Email sender using the Resend API.
 *
 * @see https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendEmailSender implements EmailSender {
  private readonly baseUrl: string;

  constructor(private readonly config: ResendEmailConfig) {
    this.baseUrl = config.baseUrl ?? 'https://api.resend.com';
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    const from = message.from ?? this.config.defaultFrom;

    const body: Record<string, unknown> = {
      from: this.formatAddress(from),
      to: this.formatRecipients(message.to),
      subject: message.subject,
      html: message.html,
    };

    if (message.text) body.text = message.text;
    if (message.replyTo) body.reply_to = this.formatAddress(message.replyTo);
    if (message.tags?.length) {
      body.tags = message.tags.map((tag) => ({ name: tag, value: 'true' }));
    }

    const response = await fetch(`${this.baseUrl}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        message: response.statusText,
      }))) as ResendErrorResponse;
      throw new EmailError(`Resend API error (${response.status}): ${error.message}`);
    }

    const data = (await response.json()) as ResendSuccessResponse;
    return { messageId: data.id };
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailResult[]> {
    const from = this.config.defaultFrom;

    const batch = messages.map((msg) => ({
      from: this.formatAddress(msg.from ?? from),
      to: this.formatRecipients(msg.to),
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
      ...(msg.replyTo ? { reply_to: this.formatAddress(msg.replyTo) } : {}),
      ...(msg.tags?.length ? { tags: msg.tags.map((tag) => ({ name: tag, value: 'true' })) } : {}),
    }));

    const response = await fetch(`${this.baseUrl}/emails/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        message: response.statusText,
      }))) as ResendErrorResponse;
      throw new EmailError(`Resend batch API error (${response.status}): ${error.message}`);
    }

    const data = (await response.json()) as { data: ResendSuccessResponse[] };
    return data.data.map((d) => ({ messageId: d.id }));
  }

  private formatAddress(addr: EmailAddress): string {
    return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
  }

  private formatRecipients(to: EmailAddress | EmailAddress[]): string[] {
    const list = Array.isArray(to) ? to : [to];
    return list.map((r) => this.formatAddress(r));
  }
}

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}
