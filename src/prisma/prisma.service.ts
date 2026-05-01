import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { prismaPGAdapter } from '../../prisma/adapter/prismaPGAdapter';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const database_url = configService.getOrThrow<string>('database.url');

    super({
      adapter: prismaPGAdapter(database_url),
    });
  }
  async onModuleInit() {
    await this.$connect();
    console.log('✅ DataBase connected');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected ');
  }
}
