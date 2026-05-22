import { Controller, Get } from '@nestjs/common';

/**
 * Minimal health check endpoint used by Kubernetes readiness and liveness probes.
 * GET /health → 200 { status: 'ok' }
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
