import { Module } from '@nestjs/common';

import { SanitizerService } from './sanitizer.service.js';

@Module({
  providers: [SanitizerService],
  exports: [SanitizerService],
})
export class SanitizerModule {}
