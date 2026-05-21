import { Controller, Get, Query } from '@nestjs/common';

import { MetricsQueryDto } from './dto/metrics-query.dto.js';
import { MetricsService } from './metrics.service.js';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  summary(@Query() query: MetricsQueryDto) {
    return this.metricsService.summary(query);
  }
}

