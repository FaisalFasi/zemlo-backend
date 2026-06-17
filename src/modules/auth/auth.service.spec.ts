import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PermissionResolverService } from './services/permission-resolver.service';

jest.mock('../../common/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));

describe('AuthService security rules', () => {
  let service: AuthService;

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
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'SESSION_EXPIRES_DAYS') {
        return 7;
      }

      if (key === 'JWT_EXPIRES_IN') {
        return '7d';
      }

      return undefined;
    }),
  };

  const permissionResolverMock = {
    getUserPermissions: jest.fn().mockResolvedValue([]),
  };

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: PermissionResolverService,
          useValue: permissionResolverMock,
        },
      ],
    }).compile();

    service = module.get(AuthService);

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.platformSettings.findUnique.mockResolvedValue({
      allowAccountRegistration: true,
      requireEmailVerification: false,
    });

    prismaMock.session.create.mockResolvedValue({
      sessionId: 'session-1',
    });

    prismaMock.user.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 'user-1',
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: null,
        avatar: null,
        role: data.role,
        isActive: true,
        isVerified: data.isVerified,
        verificationToken: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogin: null,
        createdAt,
        updatedAt,
      }),
    );
  });

  it('always creates public registrations as CUSTOMER', async () => {
    const result = await service.register({
      email: '  Customer@Example.com ',
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
    expect(result.message).toBe('Account created successfully');
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
  });
});
