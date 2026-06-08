import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermissionResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissions(params: {
    userId: string;
    role: UserRole;
  }): Promise<string[]> {
    const now = new Date();

    const [rolePermissions, userPermissions] = await Promise.all([
      this.prisma.rolePermission.findMany({
        where: {
          role: params.role,
        },
        include: {
          permission: true,
        },
      }),
      this.prisma.userPermission.findMany({
        where: {
          userId: params.userId,
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
        include: {
          permission: true,
        },
      }),
    ]);

    const permissions = [
      ...rolePermissions.map(
        (rolePermission) => rolePermission.permission.name,
      ),
      ...userPermissions.map(
        (userPermission) => userPermission.permission.name,
      ),
    ];

    return [...new Set(permissions)];
  }
}
