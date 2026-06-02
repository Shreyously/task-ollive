import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from './common/logger.module.js';
import { envValidationSchema } from './config/env.validation.js';
import { workerConfig } from './config/worker.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { QueueModule } from './queue/queue.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [workerConfig],
      validationSchema: envValidationSchema,
      cache: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('worker.redis.url')!;
        const parsed = new URL(redisUrl);
        return {
          connection: {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            tls: parsed.protocol === 'rediss:' ? {} : undefined,
          },
        };
      },
    }),
    LoggerModule,
    PrismaModule,
    RedisModule,
    QueueModule,
  ],
})
export class WorkerModule {}
