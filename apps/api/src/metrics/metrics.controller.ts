import { Controller, Get, Inject, Query } from '@nestjs/common';

import { MetricsQueryDto } from './dto/metrics-query.dto.js';
import { MetricsService } from './metrics.service.js';

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(MetricsService)
    private readonly metricsService: MetricsService,
  ) {}

  @Get('summary')
  summary(@Query() query: MetricsQueryDto) {
    return this.metricsService.summary(query);
  }

  @Get('overview')
  overview(@Query() query: MetricsQueryDto) {
    return this.metricsService.overview(query);
  }

  @Get('usage')
  usage(@Query() query: MetricsQueryDto) {
    return this.metricsService.usage(query);
  }

  @Get('trends')
  trends(@Query() query: MetricsQueryDto) {
    return this.metricsService.trends(query);
  }
}


