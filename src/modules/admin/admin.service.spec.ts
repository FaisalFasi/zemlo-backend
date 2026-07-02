import { UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminService } from './admin.service';

jest.mock('../../common/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-admin-password'),
}));

describe('AdminService bootstrap security', () => {
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AdminService(prismaMock as unknown as PrismaService);

    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      firstName: 'Faisal',
      lastName: 'Rehman',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isVerified: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock),
    );
  });

  it('creates a verified and active SUPER_ADMIN', async () => {
    const result = await service.bootstrapSuperAdmin({
      email: ' Admin@Example.com ',
      password: 'StrongPassword123!',
      firstName: ' Faisal ',
      lastName: ' Rehman ',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'admin@example.com',
        password: 'hashed-admin-password',
        firstName: 'Faisal',
        lastName: 'Rehman',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    expect(result.created).toBe(true);
    expect(result.admin?.role).toBe(UserRole.SUPER_ADMIN);
  });

  it('refuses bootstrap when a SUPER_ADMIN already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'existing-admin',
    });

    await expect(
      service.bootstrapSuperAdmin({
        email: 'admin@example.com',
        password: 'StrongPassword123!',
        firstName: 'Faisal',
        lastName: 'Rehman',
      }),
    ).rejects.toThrow('A SUPER_ADMIN account already exists');

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('supports dry-run without writing to the database', async () => {
    const result = await service.bootstrapSuperAdmin(
      {
        email: 'admin@example.com',
        password: 'StrongPassword123!',
        firstName: 'Faisal',
        lastName: 'Rehman',
      },
      {
        dryRun: true,
      },
    );

    expect(result).toEqual({
      created: false,
      admin: null,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});
