import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  const port = configService.get<number>('http.port', 3000);

  const corsOrigins = configService.get<string[]>('http.corsOrigins') ?? [];

  const trustProxyHops = configService.get<number>('http.trustProxyHops', 0);

  const swaggerEnabled = configService.get<boolean>('swagger.enabled', false);

  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, corsOrigins.includes(origin));
    },
    credentials: false,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'x-guest-id',
      'stripe-signature',
    ],
    exposedHeaders: ['Retry-After'],
    maxAge: 86_400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Zemlo API')
      .setDescription('Zemlo backend API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token',
        },
        'access-token',
      )
      .build();

    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api', app, documentFactory);
  }

  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  Logger.log(`API running on http://localhost:${port}`, 'Bootstrap');

  if (swaggerEnabled) {
    Logger.log(
      `Swagger available on http://localhost:${port}/api`,
      'Bootstrap',
    );
  }
}

void bootstrap();
