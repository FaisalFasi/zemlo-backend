/**
 *  prisma client is auto generated type safe database client which let you write queries without needing raw sql queries.
 *
 * type safety
 * Times Saving: gives boilerplate code
 * we can use simple JS functions instead complex SQL queries
 *
 *  instead of this
 *  await db.query('SELECT * FROM users WHERE email = $1', ['test@test.com']);
 *
 *  we can write
 *   await prisma.user.findUnique({ where: { email: 'test@test.com' } });
 * */
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { prismaPGAdapter } from '../../prisma/adapter/prismaPGAdapter';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(ConfigService)
    configService: ConfigService,
  ) {
    const databaseUrl = configService.get<string>('database.url');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing');
    }

    const environment = configService.get<string>(
      'app.environment',
      'development',
    );

    super({
      adapter: prismaPGAdapter(databaseUrl),
      log:
        environment === 'development' ? ['warn', 'error'] : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ DataBase connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('✅ Database connection closed');
  }
}
