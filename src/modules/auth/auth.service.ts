import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthSessionResponseDto,
  CurrentUserResponseDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PermissionResolverService } from './services/permission-resolver.service';
import { EmailService } from '../email/email.service';

import { MessageResponseDto } from '../../common/dto/message-response.dto';
import type { PermissionName } from '../../common/constants/permissions';

// OWASP/NIST guidance for password-reset (not email-verification) links is
// short-lived — minutes to ~1 hour, not 24h+. Configurable via env so this
// can be tuned without a code change, but 60 minutes is the secure default.
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

// Don't send a second reset email to the same address within this window,
// even if the request comes from a different IP than the throttle guard
// tracks — protects the recipient's inbox and avoids paying for emails
// nobody asked for.
const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly permissionResolver: PermissionResolverService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSessionResponseDto> {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const settings = await this.prisma.platformSettings.findUnique({
      where: {
        id: 'default',
      },
    });

    if (settings && !settings.allowAccountRegistration) {
      throw new ForbiddenException('Account registration is disabled');
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: UserRole.CUSTOMER,
        isVerified: !settings?.requireEmailVerification,
      },
    });

    const { accessToken, sessionId } = await this.createSessionAndToken(user);

    const permissions = await this.permissionResolver.getUserPermissions({
      userId: user.id,
      role: user.role,
    });

    return {
      message: 'Account created successfully',
      user: this.buildUserResponse(user, sessionId, permissions),
      accessToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthSessionResponseDto> {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account is disabled');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { accessToken, sessionId } =
      await this.createSessionAndToken(updatedUser);

    const permissions = await this.permissionResolver.getUserPermissions({
      userId: user.id,
      role: user.role,
    });

    return {
      message: 'Login successful',
      user: this.buildUserResponse(updatedUser, sessionId, permissions),
      accessToken,
    };
  }

  async me(user: AuthenticatedUser): Promise<CurrentUserResponseDto> {
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!freshUser) {
      throw new NotFoundException('User not found');
    }

    const permissions = await this.permissionResolver.getUserPermissions({
      userId: user.id,
      role: user.role,
    });

    return {
      user: this.buildUserResponse(freshUser, user.sessionId, permissions),
    };
  }

  async logout(user: AuthenticatedUser): Promise<MessageResponseDto> {
    await this.prisma.session.updateMany({
      where: {
        sessionId: user.sessionId,
        userId: user.id,
      },
      data: {
        isRevoked: true,
      },
    });

    return {
      message: 'Logout successful',
    };
  }

  /**
   * Always returns the same generic message, whether or not the email
   * exists — revealing that would let an attacker enumerate registered
   * accounts.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const genericResponse: MessageResponseDto = {
      message:
        'If an account exists for that email, a password reset link has been sent.',
    };

    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return genericResponse;
    }

    if (this.wasResetTokenIssuedRecently(user.resetPasswordExpires)) {
      return genericResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = this.hashResetToken(rawToken);
    const tokenTtlMs = this.getResetTokenTtlMs();
    const resetPasswordExpires = new Date(Date.now() + tokenTtlMs);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires,
      },
    });

    const resetBaseUrl = this.configService.get<string>(
      'email.passwordResetUrl',
      'http://localhost:3000/reset-password',
    );

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${resetBaseUrl}?token=${rawToken}`,
      expiresInMinutes: Math.round(tokenTtlMs / 60_000),
    });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const hashedToken = this.hashResetToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      }),
      // Reset means "assume the account may have been compromised" —
      // revoke every existing session, not just future ones.
      this.prisma.session.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      }),
    ]);

    return {
      message:
        'Password reset successful. Please log in with your new password.',
    };
  }

  private hashResetToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private getResetTokenTtlMs(): number {
    const ttlMinutes = this.configService.get<number>(
      'email.passwordResetTokenTtlMinutes',
      DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES,
    );

    return ttlMinutes * 60 * 1000;
  }

  private wasResetTokenIssuedRecently(
    resetPasswordExpires: Date | null,
  ): boolean {
    if (!resetPasswordExpires) {
      return false;
    }

    const issuedAt = resetPasswordExpires.getTime() - this.getResetTokenTtlMs();

    return Date.now() - issuedAt < PASSWORD_RESET_RESEND_COOLDOWN_MS;
  }

  private async createSessionAndToken(user: User) {
    const sessionDays = this.configService.get<number>(
      'session.expiresDays',
      7,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionDays);

    const session = await this.prisma.session.create({
      data: {
        sessionId: randomUUID(),
        userId: user.id,
        expiresAt,
      },
    });

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    };

    const expiresIn = this.configService.get<string>(
      'jwt.expiresIn',
      '7d',
    ) as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    return {
      accessToken,
      sessionId: session.sessionId,
    };
  }

  private buildUserResponse(
    user: User,
    sessionId: string,
    permissions: PermissionName[],
  ): AuthSessionResponseDto['user'] {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      sessionId,
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
