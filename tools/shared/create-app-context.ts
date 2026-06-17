import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../src/app.module';

export function createToolAppContext(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
}
