import { PermissionCategory, PrismaClient } from '@prisma/client';

import {
  PERMISSIONS,
  type PermissionName,
} from '../../src/common/constants/permissions';

type PermissionSeed = {
  name: PermissionName;
  displayName: string;
  description: string;
  category: PermissionCategory;
};

export const permissionsData = [
  // PRODUCTS
  {
    name: PERMISSIONS.PRODUCTS_VIEW,
    displayName: 'View Products',
    description: 'Can view products',
    category: PermissionCategory.PRODUCTS,
  },
  {
    name: PERMISSIONS.PRODUCTS_CREATE,
    displayName: 'Create Products',
    description: 'Can create products',
    category: PermissionCategory.PRODUCTS,
  },
  {
    name: PERMISSIONS.PRODUCTS_UPDATE,
    displayName: 'Update Products',
    description: 'Can update products',
    category: PermissionCategory.PRODUCTS,
  },
  {
    name: PERMISSIONS.PRODUCTS_DELETE,
    displayName: 'Delete Products',
    description: 'Can delete or archive products',
    category: PermissionCategory.PRODUCTS,
  },

  // CATEGORIES
  {
    name: PERMISSIONS.CATEGORIES_VIEW,
    displayName: 'View Categories',
    description: 'Can view categories',
    category: PermissionCategory.CATEGORIES,
  },
  {
    name: PERMISSIONS.CATEGORIES_CREATE,
    displayName: 'Create Categories',
    description: 'Can create categories',
    category: PermissionCategory.CATEGORIES,
  },
  {
    name: PERMISSIONS.CATEGORIES_UPDATE,
    displayName: 'Update Categories',
    description: 'Can update categories',
    category: PermissionCategory.CATEGORIES,
  },
  {
    name: PERMISSIONS.CATEGORIES_DELETE,
    displayName: 'Delete Categories',
    description: 'Can delete categories',
    category: PermissionCategory.CATEGORIES,
  },

  // BRANDS
  {
    name: PERMISSIONS.BRANDS_VIEW,
    displayName: 'View Brands',
    description: 'Can view brands',
    category: PermissionCategory.BRANDS,
  },
  {
    name: PERMISSIONS.BRANDS_CREATE,
    displayName: 'Create Brands',
    description: 'Can create brands',
    category: PermissionCategory.BRANDS,
  },
  {
    name: PERMISSIONS.BRANDS_UPDATE,
    displayName: 'Update Brands',
    description: 'Can update brands',
    category: PermissionCategory.BRANDS,
  },
  {
    name: PERMISSIONS.BRANDS_DELETE,
    displayName: 'Delete Brands',
    description: 'Can delete brands',
    category: PermissionCategory.BRANDS,
  },

  // ORDERS
  {
    name: PERMISSIONS.ORDERS_VIEW_OWN,
    displayName: 'View Own Orders',
    description: 'Customers can view their own orders',
    category: PermissionCategory.ORDERS,
  },
  {
    name: PERMISSIONS.ORDERS_VIEW_ALL,
    displayName: 'View All Orders',
    description: 'Can view all customer orders',
    category: PermissionCategory.ORDERS,
  },
  {
    name: PERMISSIONS.ORDERS_UPDATE,
    displayName: 'Update Orders',
    description: 'Can update order status and details',
    category: PermissionCategory.ORDERS,
  },
  {
    name: PERMISSIONS.ORDERS_CANCEL,
    displayName: 'Cancel Orders',
    description: 'Can cancel orders',
    category: PermissionCategory.ORDERS,
  },

  // CUSTOMERS
  {
    name: PERMISSIONS.CUSTOMERS_VIEW,
    displayName: 'View Customers',
    description: 'Can view customer accounts',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    name: PERMISSIONS.CUSTOMERS_UPDATE,
    displayName: 'Update Customers',
    description: 'Can update customer details',
    category: PermissionCategory.CUSTOMERS,
  },
  {
    name: PERMISSIONS.CUSTOMERS_DISABLE,
    displayName: 'Disable Customers',
    description: 'Can disable customer accounts',
    category: PermissionCategory.CUSTOMERS,
  },

  // STAFF
  {
    name: PERMISSIONS.STAFF_VIEW,
    displayName: 'View Staff',
    description: 'Can view staff accounts',
    category: PermissionCategory.STAFF,
  },
  {
    name: PERMISSIONS.STAFF_CREATE,
    displayName: 'Create Staff',
    description: 'Can create staff accounts',
    category: PermissionCategory.STAFF,
  },
  {
    name: PERMISSIONS.STAFF_UPDATE,
    displayName: 'Update Staff',
    description: 'Can update staff accounts',
    category: PermissionCategory.STAFF,
  },
  {
    name: PERMISSIONS.STAFF_DISABLE,
    displayName: 'Disable Staff',
    description: 'Can disable staff accounts',
    category: PermissionCategory.STAFF,
  },
  {
    name: PERMISSIONS.STAFF_PERMISSIONS,
    displayName: 'Manage Staff Permissions',
    description: 'Can assign or remove staff permissions',
    category: PermissionCategory.STAFF,
  },

  // SETTINGS
  {
    name: PERMISSIONS.SETTINGS_VIEW,
    displayName: 'View Settings',
    description: 'Can view platform settings',
    category: PermissionCategory.SETTINGS,
  },
  {
    name: PERMISSIONS.SETTINGS_UPDATE,
    displayName: 'Update Settings',
    description: 'Can update platform settings',
    category: PermissionCategory.SETTINGS,
  },

  // ANALYTICS
  {
    name: PERMISSIONS.ANALYTICS_VIEW,
    displayName: 'View Analytics',
    description: 'Can view dashboard analytics',
    category: PermissionCategory.ANALYTICS,
  },
] satisfies PermissionSeed[];

export async function seedPermissions(prisma: PrismaClient) {
  console.log('📝 Creating permissions...');

  for (const permission of permissionsData) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        displayName: permission.displayName,
        description: permission.description,
        category: permission.category,
      },
      create: permission,
    });
  }

  console.log(`✅ Created/verified ${permissionsData.length} permissions`);
}
