import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { AppLogger } from './common/logging/logger.service.js';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(AppLogger);

  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  app.enableCors({
    origin: configService.get<string>('app.api.corsOrigin') ?? 'http://localhost:5173',
    credentials: false,
  });

  const port = configService.get<number>('app.api.port') ?? 3001;
  const host = configService.get<string>('app.api.host') ?? '0.0.0.0';

  await app.listen(port, host);
  logger.withContext().info({ host, port }, 'api.started');
}

bootstrap().catch((error: unknown) => {
   
  console.error('Fatal bootstrap error:', error);
  process.exit(1);
});
