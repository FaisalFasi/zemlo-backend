import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception while exporting OpenAPI');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection while exporting OpenAPI');
  console.error(reason);
  process.exit(1);
});

process.on('exit', (code) => {
  console.log(`ℹ️ OpenAPI export process exited with code ${code}`);
});

async function bootstrap() {
  console.log('⏳ Exporting OpenAPI contract...');
  console.log(`📍 Working directory: ${process.cwd()}`);

  console.log('1️⃣ Creating Nest application...');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    abortOnError: false,
  });
  console.log('2️⃣ Nest application created.');

  console.log('3️⃣ Initializing Nest application...');
  await app.init();
  console.log('4️⃣ Nest application initialized.');

  const config = new DocumentBuilder()
    .setTitle('Zemlo API')
    .setDescription('Zemlo e-commerce backend API contract')
    .setVersion('1.0.0')
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

  console.log('5️⃣ Creating Swagger document...');
  const document = SwaggerModule.createDocument(app, config);
  console.log(
    `6️⃣ Swagger document created. Paths: ${Object.keys(document.paths).length}`,
  );

  const outputPath = join(process.cwd(), 'openapi.json');

  console.log(`7️⃣ Writing OpenAPI file to: ${outputPath}`);
  writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');

  console.log(`8️⃣ File exists after write: ${existsSync(outputPath)}`);

  await app.close();

  console.log('✅ OpenAPI contract exported successfully.');
}

void bootstrap().catch((error) => {
  console.error('❌ Failed to export OpenAPI contract');
  console.error(error);
  process.exit(1);
});
