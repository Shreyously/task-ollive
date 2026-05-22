import type { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import pino, { type Logger } from 'pino';

@Injectable()
export class WorkerLogger implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      base: { service: 'worker' },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }

  get pino(): Logger {
    return this.logger;
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.info({ optionalParams }, String(message));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.error({ optionalParams }, String(message));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.warn({ optionalParams }, String(message));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.debug({ optionalParams }, String(message));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.trace({ optionalParams }, String(message));
  }
}
