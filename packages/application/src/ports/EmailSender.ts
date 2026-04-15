/**
 * Email address with optional display name.
 *
 * @example
 * { email: 'customer@example.com', name: 'Jane Doe' }
 */
export interface EmailAddress {
  readonly email: string;
  readonly name?: string;
}

/**
 * A single email message to be sent.
 */
export interface EmailMessage {
  /** Recipient address(es). */
  readonly to: EmailAddress | EmailAddress[];
  /** Subject line. */
  readonly subject: string;
  /** HTML body. */
  readonly html: string;
  /** Optional plain-text body (auto-generated from HTML if omitted). */
  readonly text?: string;
  /** Optional sender override (defaults to system sender). */
  readonly from?: EmailAddress;
  /** Optional reply-to address. */
  readonly replyTo?: EmailAddress;
  /** Optional tags for analytics (e.g. ['order-confirmation', 'transactional']). */
  readonly tags?: string[];
}

/**
 * Result of a send operation.
 */
export interface EmailResult {
  /** Provider-assigned message ID. */
  readonly messageId: string;
}

/**
 * Port for sending emails.
 *
 * Application layer depends on this interface; infrastructure layer
 * provides concrete adapters (Resend, SES, SMTP, console, etc.).
 *
 * @example
 * ```typescript
 * // In a use-case
 * constructor(private readonly emailSender: EmailSender) {}
 *
 * async execute() {
 *   await this.emailSender.send({
 *     to: { email: 'buyer@example.com', name: 'Jane' },
 *     subject: 'Order Confirmed',
 *     html: '<h1>Thanks for your order!</h1>',
 *   });
 * }
 * ```
 */
export interface EmailSender {
  /** Send a single email. */
  send(message: EmailMessage): Promise<EmailResult>;

  /** Send multiple emails (may batch internally). */
  sendBatch(messages: EmailMessage[]): Promise<EmailResult[]>;
}
