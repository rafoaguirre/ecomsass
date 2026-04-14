import { timingSafeEqual } from 'node:crypto';
import { Inject, Module, type OnModuleInit, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { BullMQQueue } from '@ecomsaas/infrastructure/queue';
import { JOB_QUEUE } from '../redis';
import type { Queue } from '@ecomsaas/infrastructure/queue';
import type { Request, Response, NextFunction } from 'express';

const ADMIN_QUEUES_PATH = '/admin/queues';

/**
 * Bull Board admin UI module.
 *
 * Mounts the Bull Board dashboard at /admin/queues.
 * Only active when BullMQ is the queue backend (Redis configured).
 *
 * Security:
 * - In production, requires BULL_BOARD_PASSWORD to be set (otherwise disabled).
 * - When credentials are configured, applies HTTP Basic Auth.
 */
@Module({})
export class BullBoardModule implements OnModuleInit {
  private readonly logger = new Logger('BullBoardModule');

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @Inject(JOB_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService
  ) {}

  onModuleInit(): void {
    const bullQueue = this.getBullQueue();
    if (!bullQueue) {
      this.logger.warn('BullMQ not active — Bull Board disabled');
      return;
    }

    const nodeEnv = this.config.get<string>('NODE_ENV');
    const password = this.config.get<string>('BULL_BOARD_PASSWORD');
    const user = this.config.get<string>('BULL_BOARD_USER') ?? 'admin';

    if (nodeEnv === 'production' && !password) {
      this.logger.warn('Bull Board disabled in production — set BULL_BOARD_PASSWORD to enable');
      return;
    }

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(ADMIN_QUEUES_PATH);

    createBullBoard({
      queues: [new BullMQAdapter(bullQueue)],
      serverAdapter,
    });

    const httpAdapter = this.httpAdapterHost.httpAdapter;

    if (password) {
      const expected = Buffer.from(`${user}:${password}`);

      httpAdapter.use(ADMIN_QUEUES_PATH, (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers.authorization ?? '';

        if (!header.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
          res.status(401).end('Unauthorized');
          return;
        }

        const provided = Buffer.from(header.slice(6), 'base64');

        if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
          res.status(401).end('Unauthorized');
          return;
        }

        next();
      });
    }

    httpAdapter.use(ADMIN_QUEUES_PATH, serverAdapter.getRouter());
    this.logger.log(`Bull Board mounted at ${ADMIN_QUEUES_PATH}`);
  }

  private getBullQueue(): ReturnType<BullMQQueue['getBullQueue']> | null {
    if ('getBullQueue' in this.queue) {
      return (this.queue as BullMQQueue).getBullQueue();
    }
    return null;
  }
}
