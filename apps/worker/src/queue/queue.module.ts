import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INFERENCE_QUEUE_NAME } from '@repo/shared-types';

import { SanitizerModule } from '../sanitizer/sanitizer.module.js';
import { DeadLetterService } from './dead-letter.service.js';
import { InferenceProcessor } from './inference.processor.js';
import { ValidationService } from './validation.service.js';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: INFERENCE_QUEUE_NAME,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name:
          configService.get<string>('worker.queue.inferenceQueueName') ??
          INFERENCE_QUEUE_NAME,
      }),
    }),
    SanitizerModule,
  ],
  providers: [InferenceProcessor, ValidationService, DeadLetterService],
  exports: [DeadLetterService],
})
export class QueueModule {}
