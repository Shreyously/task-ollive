import { Injectable, Inject } from '@nestjs/common';
import pino, { type Logger } from 'pino';
import type { LoggerService } from '@nestjs/common';

import { RequestContextService } from '../request-context/request-context.service.js';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(
    @Inject(RequestContextService)
    private readonly requestContext?: RequestContextService,
  ) {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      base: undefined,
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.withContext().info({ optionalParams }, String(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.withContext().error({ optionalParams }, String(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.withContext().warn({ optionalParams }, String(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.withContext().debug({ optionalParams }, String(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.withContext().trace({ optionalParams }, String(message));
  }

  withContext(): Logger {
    const correlationId = this.requestContext?.getCorrelationId();
    return correlationId ? this.logger.child({ correlationId }) : this.logger;
  }
}
