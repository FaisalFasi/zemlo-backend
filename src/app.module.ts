import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule], // ConfigModule.forRoot() loads env variables
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
