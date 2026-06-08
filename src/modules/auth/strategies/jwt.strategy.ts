import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthenticatedUser } from '../../../common/types/authenticated-user.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionResolverService } from '../services/permission-resolver.service';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionResolver: PermissionResolverService,
    configService: ConfigService,
  ) {
    const jwtSecret = process.env.JWT_SECRET;

    // const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is missing in .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const session = await this.prisma.session.findUnique({
      where: {
        sessionId: payload.sessionId,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.userId !== payload.userId) {
      throw new UnauthorizedException('Invalid token session');
    }

    if (session.isRevoked) {
      throw new UnauthorizedException('Session revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (!session.user) {
      throw new UnauthorizedException('User not found');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('User account is disabled');
    }

    const permissions = await this.permissionResolver.getUserPermissions({
      userId: session.user.id,
      role: session.user.role,
    });

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      sessionId: session.sessionId,
      permissions,
    };
  }
}
