import { Global, Module, Logger, Inject, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsoleEmailSender,
  ResendEmailSender,
  emailTemplates,
} from '@ecomsaas/infrastructure/email';
import type { EmailSender, EmailMessage } from '@ecomsaas/application/ports';
import type { Queue } from '@ecomsaas/infrastructure/queue';
import { JOB_QUEUE } from '../redis';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

/** Job names for email-related background work. */
export const EMAIL_JOBS = {
  SEND: 'email.send',
  ORDER_CONFIRMATION: 'email.order-confirmation',
  ORDER_STATUS_UPDATE: 'email.order-status-update',
} as const;

export { emailTemplates };

export interface OrderConfirmationJobData {
  customerEmail: string;
  customerName: string;
  orderRef: string;
  totalFormatted: string;
  items: Array<{ name: string; quantity: number; priceFormatted: string }>;
  orderUrl?: string;
  /** Idempotency key — skip if already processed. */
  idempotencyKey: string;
}

export interface OrderStatusUpdateJobData {
  customerEmail: string;
  customerName: string;
  orderRef: string;
  previousStatus: string;
  newStatus: string;
  message?: string;
  orderUrl?: string;
  idempotencyKey: string;
}

const logger = new Logger('EmailModule');

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useFactory: (config: ConfigService): EmailSender => {
        const apiKey = config.get<string>('RESEND_API_KEY');
        const fromEmail = config.get<string>('EMAIL_FROM') ?? 'noreply@ecomsaas.dev';
        const fromName = config.get<string>('EMAIL_FROM_NAME') ?? 'EcomSaaS';

        if (!apiKey) {
          logger.warn(
            'RESEND_API_KEY not configured — using console email sender (emails printed to stdout)'
          );
          return new ConsoleEmailSender();
        }

        logger.log('Resend email sender initialized');
        return new ResendEmailSender({
          apiKey,
          defaultFrom: { email: fromEmail, name: fromName },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule implements OnModuleInit {
  /** Track sent idempotency keys per instance (in-memory; replace with Redis SET for durable cross-instance dedup). */
  private readonly processedKeys = new Set<string>();

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    @Inject(JOB_QUEUE) private readonly queue: Queue
  ) {}

  async onModuleInit(): Promise<void> {
    this.registerJobHandlers();
  }

  private registerJobHandlers(): void {
    // Generic send handler
    this.queue.process<EmailMessage>(EMAIL_JOBS.SEND, async (job) => {
      await this.emailSender.send(job.data);
      logger.log(`Email sent: ${job.data.subject} → ${formatTo(job.data)}`);
    });

    // Order confirmation handler
    this.queue.process<OrderConfirmationJobData>(EMAIL_JOBS.ORDER_CONFIRMATION, async (job) => {
      if (this.processedKeys.has(job.data.idempotencyKey)) {
        logger.log(`Skipping duplicate order confirmation: ${job.data.idempotencyKey}`);
        return;
      }

      const html = emailTemplates.orderConfirmation({
        customerName: job.data.customerName,
        orderRef: job.data.orderRef,
        totalFormatted: job.data.totalFormatted,
        items: job.data.items,
        orderUrl: job.data.orderUrl,
      });

      await this.emailSender.send({
        to: { email: job.data.customerEmail, name: job.data.customerName },
        subject: `Order Confirmed — ${job.data.orderRef}`,
        html,
        tags: ['order-confirmation', 'transactional'],
      });

      this.processedKeys.add(job.data.idempotencyKey);
      logger.log(`Order confirmation sent: ${job.data.orderRef} → ${job.data.customerEmail}`);
    });

    // Order status update handler
    this.queue.process<OrderStatusUpdateJobData>(EMAIL_JOBS.ORDER_STATUS_UPDATE, async (job) => {
      if (this.processedKeys.has(job.data.idempotencyKey)) {
        logger.log(`Skipping duplicate status update: ${job.data.idempotencyKey}`);
        return;
      }

      const html = emailTemplates.orderStatusUpdate({
        customerName: job.data.customerName,
        orderRef: job.data.orderRef,
        previousStatus: job.data.previousStatus,
        newStatus: job.data.newStatus,
        message: job.data.message,
        orderUrl: job.data.orderUrl,
      });

      await this.emailSender.send({
        to: { email: job.data.customerEmail, name: job.data.customerName },
        subject: `Order ${job.data.orderRef} — ${job.data.newStatus}`,
        html,
        tags: ['order-status-update', 'transactional'],
      });

      this.processedKeys.add(job.data.idempotencyKey);
      logger.log(
        `Order status email sent: ${job.data.orderRef} (${job.data.newStatus}) → ${job.data.customerEmail}`
      );
    });

    logger.log('Email job handlers registered');
  }
}

function formatTo(msg: EmailMessage): string {
  const to = Array.isArray(msg.to) ? msg.to : [msg.to];
  return to.map((r) => r.email).join(', ');
}
