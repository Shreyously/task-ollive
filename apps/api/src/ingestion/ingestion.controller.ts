import { Body, Controller, Post } from '@nestjs/common';

import { CreateIngestionEventDto } from './dto/create-ingestion-event.dto.js';
import { IngestionService } from './ingestion.service.js';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('events')
  enqueue(@Body() dto: CreateIngestionEventDto) {
    return this.ingestionService.enqueue(dto);
  }
}

