import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type User, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PermissionResolverService } from './services/permission-resolver.service';

jest.mock('../../common/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));

describe('AuthService registration security', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    platformSettings: {
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const permissionResolverMock = {
    getUserPermissions: jest.fn(),
  };

  let service: AuthService;

  const createdUser: User = {
    id: 'user-1',
    email: 'customer@example.com',
    password: 'hashed-password',
    firstName: 'Faisal',
    lastName: 'Rehman',
    phone: null,
    avatar: null,
    role: UserRole.CUSTOMER,
    isActive: true,
    isVerified: true,
    verificationToken: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastLogin: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
      configServiceMock as unknown as ConfigService,
      permissionResolverMock as unknown as PermissionResolverService,
    );

    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.platformSettings.findUnique.mockResolvedValue({
      allowAccountRegistration: true,
      requireEmailVerification: false,
    });

    prismaMock.user.create.mockResolvedValue(createdUser);

    prismaMock.session.create.mockResolvedValue({
      sessionId: 'session-1',
    });

    jwtServiceMock.signAsync.mockResolvedValue('access-token');

    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'SESSION_EXPIRES_DAYS') {
        return 7;
      }

      if (key === 'JWT_EXPIRES_IN') {
        return '7d';
      }

      return undefined;
    });

    permissionResolverMock.getUserPermissions.mockResolvedValue([]);
  });

  it('always creates a public registration as CUSTOMER', async () => {
    const result = await service.register({
      email: ' Customer@Example.com ',
      password: 'Password123!',
      firstName: ' Faisal ',
      lastName: ' Rehman ',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'customer@example.com',
        password: 'hashed-password',
        firstName: 'Faisal',
        lastName: 'Rehman',
        role: UserRole.CUSTOMER,
        isVerified: true,
      },
    });

    expect(result.user.role).toBe(UserRole.CUSTOMER);
    expect(result.accessToken).toBe('access-token');
  });

  it('blocks registration when account registration is disabled', async () => {
    prismaMock.platformSettings.findUnique.mockResolvedValue({
      allowAccountRegistration: false,
      requireEmailVerification: false,
    });

    await expect(
      service.register({
        email: 'customer@example.com',
        password: 'Password123!',
        firstName: 'Faisal',
        lastName: 'Rehman',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.session.create).not.toHaveBeenCalled();
  });
});
