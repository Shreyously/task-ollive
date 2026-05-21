import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';

import { ChatModule } from './chat/chat.module.js';
import { AppLogger } from './common/logging/logger.service.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import { RequestContextService } from './common/request-context/request-context.service.js';
import { appConfig } from './config/app.config.js';
import { envValidationSchema } from './config/env.validation.js';
import { ConversationModule } from './conversation/conversation.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { MessageModule } from './message/message.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProviderModule } from './provider/provider.module.js';
import { QueueModule } from './queue/queue.module.js';
import { RedisModule } from './redis/redis.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
      load: [appConfig],
      validationSchema: envValidationSchema,
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttle.ttlMs') ?? 60_000,
            limit: configService.get<number>('app.throttle.limit') ?? 120,
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    ConversationModule,
    MessageModule,
    ChatModule,
    ProviderModule,
    MetricsModule,
    IngestionModule,
  ],
  providers: [
    AppLogger,
    RequestContextService,
    CorrelationIdMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
