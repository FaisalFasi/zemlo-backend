import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../../../common/types/authenticated-user.type';

//  Extract token from Authorization header
// 2. Verify token using JWT_SECRET
// 3. Read token payload
// 4. Find session in database
// 5. Check session is not revoked
// 6. Check session is not expired
// 7. Check user still exists and is active
// 8. Return user

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

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
      where: { sessionId: payload.sessionId },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
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

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      role: session.user.role,
      sessionId: session.sessionId,
    };
  }
}
