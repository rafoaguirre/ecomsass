import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainError } from '@ecomsaas/domain';
import type { Request, Response } from 'express';

const DOMAIN_ERROR_STATUS_MAP: Record<string, HttpStatus> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  PERMISSION_ERROR: HttpStatus.FORBIDDEN,
  INVARIANT_ERROR: HttpStatus.UNPROCESSABLE_ENTITY,
  CONCURRENCY_ERROR: HttpStatus.CONFLICT,
  QUOTA_EXCEEDED: HttpStatus.TOO_MANY_REQUESTS,
};

/**
 * Duck-type check for DomainError to handle cross-module-boundary
 * instanceof failures (ESM/CJS, duplicate packages, etc.).
 */
function isDomainError(error: unknown): error is DomainError {
  return (
    error instanceof DomainError ||
    (error instanceof Error &&
      'code' in error &&
      typeof (error as DomainError).code === 'string' &&
      (error as DomainError).code in DOMAIN_ERROR_STATUS_MAP)
  );
}

/**
 * Global exception filter that catches all exceptions and returns
 * a consistent JSON error response.
 *
 * Maps DomainError subclasses to appropriate HTTP statuses and
 * falls back to 500 for unknown errors.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string }).message ?? exception.message);
    } else if (isDomainError(exception)) {
      status = DOMAIN_ERROR_STATUS_MAP[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${String(status)}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(code && { code }),
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
