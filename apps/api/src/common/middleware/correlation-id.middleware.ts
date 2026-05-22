import { randomUUID } from 'node:crypto';

import type { NestMiddleware } from '@nestjs/common';
import { Inject,Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestContextService } from '../request-context/request-context.service.js';

type RequestWithCorrelation = Request & { correlationId?: string };

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    @Inject(RequestContextService)
    private readonly requestContext?: RequestContextService,
  ) {}

  use(req: RequestWithCorrelation, res: Response, next: NextFunction): void {
    const headerName = (process.env.CORRELATION_ID_HEADER ?? 'x-correlation-id').toLowerCase();
    const incoming = req.headers[headerName];
    const correlationId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();

    req.correlationId = correlationId;
    res.setHeader(headerName, correlationId);

    if (this.requestContext) {
      this.requestContext.run({ correlationId }, () => next());
    } else {
      next();
    }
  }
}
