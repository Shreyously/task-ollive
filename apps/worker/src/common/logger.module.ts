import { Global, Module } from '@nestjs/common';

import { WorkerLogger } from './logger.service.js';

@Global()
@Module({
  providers: [WorkerLogger],
  exports: [WorkerLogger],
})
export class LoggerModule {}
