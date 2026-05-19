import { PrismaClient, UserRole } from '@prisma/client';
import { permissionsData } from './permissions.seed';

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('🔗 Assigning default permissions to roles...');

  const allPermissionNames = permissionsData.map(
    (permission) => permission.name,
  );

  const rolePermissionsMap: Record<UserRole, string[]> = {
    CUSTOMER: ['products.view', 'orders.view_own'],

    STAFF: [
      'products.view',
      'categories.view',
      'brands.view',
      'orders.view_all',
      'customers.view',
    ],

    ADMIN: [
      'products.view',
      'products.create',
      'products.update',
      'products.delete',

      'categories.view',
      'categories.create',
      'categories.update',
      'categories.delete',

      'brands.view',
      'brands.create',
      'brands.update',
      'brands.delete',

      'orders.view_own',
      'orders.view_all',
      'orders.update',
      'orders.cancel',

      'customers.view',
      'customers.update',
      'customers.disable',

      'staff.view',
      'staff.create',
      'staff.update',
      'staff.disable',

      'settings.view',
      'analytics.view',
    ],

    SUPER_ADMIN: allPermissionNames,
  };

  for (const [role, permissionNames] of Object.entries(rolePermissionsMap)) {
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
            role: role as UserRole,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: role as UserRole,
          permissionId: permission.id,
        },
      });
    }

    console.log(`✅ ${role} role configured`);
  }
}
