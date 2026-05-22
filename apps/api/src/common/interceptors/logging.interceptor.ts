import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import {
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

import { serializeError } from '../logging/error-serializer.js';
import { AppLogger } from '../logging/logger.service.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { correlationId?: string }>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.withContext().info(
            {
              method: request.method,
              path: request.url,
              statusCode: context.switchToHttp().getResponse<{ statusCode: number }>().statusCode,
              latencyMs: Date.now() - start,
            },
            'request.completed',
          );
        },
        error: (error: unknown) => {
          this.logger.withContext().error(
            {
              method: request.method,
              path: request.url,
              latencyMs: Date.now() - start,
              error: serializeError(error),
            },
            'request.failed',
          );
        },
      }),
    );
  }
}
