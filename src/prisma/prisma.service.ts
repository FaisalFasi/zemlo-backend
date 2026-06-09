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
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { prismaPGAdapter } from '../../prisma/adapter/prismaPGAdapter';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing');
    }

    super({
      adapter: prismaPGAdapter(databaseUrl),
      log:
        process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['warn', 'error'],
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
