import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('worker.redis.url') ?? 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
