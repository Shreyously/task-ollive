import { Global, Module } from '@nestjs/common';

import { RequestContextService } from '../request-context/request-context.service.js';
import { AppLogger } from './logger.service.js';

@Global()
@Module({
  providers: [AppLogger, RequestContextService],
  exports: [AppLogger, RequestContextService],
})
export class LoggerModule {}
