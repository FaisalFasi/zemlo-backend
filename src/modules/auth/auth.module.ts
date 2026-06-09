import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionResolverService } from './services/permission-resolver.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');

        if (!secret) {
          throw new Error('JWT_SECRET is missing in .env');
        }

        return {
          secret,
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, PermissionResolverService],
  controllers: [AuthController],
  exports: [AuthService, PermissionResolverService],
})
export class AuthModule {}
