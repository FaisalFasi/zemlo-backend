import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { validate } from './config/env.config'; // ✅ Yaha se import

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      cache: true,
    }),
    PrismaModule,
    AuthModule,
  ], // ConfigModule.forRoot() loads env variables
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
