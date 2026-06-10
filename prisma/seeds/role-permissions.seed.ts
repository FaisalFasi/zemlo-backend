import { PrismaClient, UserRole } from '@prisma/client';

import {
  PERMISSIONS,
  type PermissionName,
} from '../../src/common/constants/permissions';
import { permissionsData } from './permissions.seed';

export const allPermissionNames = permissionsData.map(
  (permission) => permission.name,
);

export const rolePermissionsMap = {
  [UserRole.CUSTOMER]: [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.ORDERS_VIEW_OWN],

  [UserRole.STAFF]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.CUSTOMERS_VIEW,
  ],

  [UserRole.ADMIN]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,

    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,

    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.BRANDS_CREATE,
    PERMISSIONS.BRANDS_UPDATE,
    PERMISSIONS.BRANDS_DELETE,

    PERMISSIONS.ORDERS_VIEW_OWN,
    PERMISSIONS.ORDERS_VIEW_ALL,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_CANCEL,

    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DISABLE,

    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DISABLE,

    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [UserRole.SUPER_ADMIN]: allPermissionNames,
} satisfies Record<UserRole, readonly PermissionName[]>;

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('🔗 Assigning default permissions to roles...');

  const rolePermissionEntries = Object.entries(rolePermissionsMap) as [
    UserRole,
    readonly PermissionName[],
  ][];

  for (const [role, permissionNames] of rolePermissionEntries) {
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        console.warn(
          `⚠️ Permission "${permissionName}" not found. Skipping...`,
        );
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role,
          permissionId: permission.id,
        },
      });
    }

    console.log(`✅ ${role} role configured`);
  }
}
