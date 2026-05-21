import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';

import { AppLogger } from '../logging/logger.service.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { correlationId?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorPayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    this.logger.withContext().error(
      {
        method: request.method,
        path: request.url,
        statusCode: status,
        error: exception,
      },
      'http.exception',
    );

    response.status(status).json({
      statusCode: status,
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorPayload,
    });
  }
}
