import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 'default' },
    });

    const usersCount = await this.prisma.user.count();
    const isFirstUser = usersCount === 0;

    if (!isFirstUser && settings && !settings.allowAccountRegistration) {
      throw new ForbiddenException('Account registration is disabled');
    }

    const hashedPassword = await hashPassword(dto.password);

    const role = isFirstUser ? UserRole.SUPER_ADMIN : UserRole.CUSTOMER;

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role,
        isVerified: isFirstUser || !settings?.requireEmailVerification,
      },
    });

    const { accessToken, sessionId } = await this.createSessionAndToken(user);

    return {
      message: isFirstUser
        ? 'Super admin account created successfully'
        : 'Account created successfully',
      user: this.buildUserResponse(user, sessionId),
      accessToken,
    };
  }

  async login(dto: LoginDto) {
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { accessToken, sessionId } = await this.createSessionAndToken(user);

    return {
      message: 'Login successful',
      user: this.buildUserResponse(user, sessionId),
      accessToken,
    };
  }

  me(user: AuthenticatedUser) {
    return {
      user,
    };
  }

  async logout(user: AuthenticatedUser) {
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

  private async createSessionAndToken(user: User) {
    const sessionDays = Number(
      this.configService.get<string>('SESSION_EXPIRES_DAYS') ?? 7,
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
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    return {
      accessToken,
      sessionId: session.sessionId,
    };
  }

  private buildUserResponse(user: User, sessionId: string) {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
