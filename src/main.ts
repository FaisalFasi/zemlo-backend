import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // ENABLE GLOBAL VALIDATION
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove extra fields
      forbidNonWhitelisted: true, // Throw error on extra fields
      transform: true, // Auto-transform to DTO class
    }),
  );

  // ============================================
  // Swagger config
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('Zemlo Api')
    .setDescription('The Zemlo API description')
    .setVersion('1.0')
    .addTag('Zemlo')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);

  console.log('🚀 Application is running on: http://localhost:3000');
}
bootstrap();
