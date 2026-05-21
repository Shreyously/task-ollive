import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import type { CreateIngestionEventDto } from './dto/create-ingestion-event.dto.js';

@Injectable()
export class IngestionService {
  constructor(@InjectQueue('inference-events') private readonly ingestionQueue: Queue) {}

  async enqueue(dto: CreateIngestionEventDto) {
    const job = await this.ingestionQueue.add(dto.eventType, dto.payload, {
      attempts: 3,
      removeOnComplete: 500,
      removeOnFail: 1000,
    });

    return { accepted: true, jobId: job.id };
  }
}

