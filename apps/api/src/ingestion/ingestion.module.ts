import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IngestionService } from './ingestion.service.js';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'inference-events',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        name: configService.get<string>('app.queue.inferenceQueueName') ?? 'inference-events',
      }),
    }),
  ],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}

