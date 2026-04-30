// ============================================
// IMPORT SECTION
// ============================================
import { PrismaClient, UserRole, PermissionCategory } from '@prisma/client';
import { prismaPGAdapter } from './adapter/prismaPGAdapter';

const adapter = prismaPGAdapter();

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
});

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  console.log('🌱 Starting Zemlo database seed...');

  // ============================================
  // STEP 1: PLATFORM SETTINGS
  // ============================================
  console.log('⚙️ Creating platform settings...');

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',

      storeName: 'Zemlo',
      storeEmail: 'support@zemlo.com',
      supportPhone: null,
      supportWhatsapp: null,

      businessCountry: 'US',

      currency: 'USD',
      taxRate: 0,
      defaultShippingCost: 0,
      freeShippingOver: null,

      allowGuestCheckout: true,
      requireEmailVerification: false,
      allowAccountRegistration: true,

      enableReviews: false,
      enableWishlist: false,
      enableCoupons: false,
      enableChat: false,
      maintenanceMode: false,

      homepageTitle: 'Zemlo',
      homepageDescription: 'Shop quality products from Zemlo.',
      announcementEnabled: false,
    },
  });

  console.log('✅ Platform settings ready');

  // ============================================
  // STEP 2: PERMISSIONS
  // ============================================
  console.log('📝 Creating permissions...');

  const permissionsData = [
    // PRODUCTS
    {
      name: 'products.view',
      displayName: 'View Products',
      description: 'Can view products',
      category: PermissionCategory.PRODUCTS,
    },
    {
      name: 'products.create',
      displayName: 'Create Products',
      description: 'Can create products',
      category: PermissionCategory.PRODUCTS,
    },
    {
      name: 'products.update',
      displayName: 'Update Products',
      description: 'Can update products',
      category: PermissionCategory.PRODUCTS,
    },
    {
      name: 'products.delete',
      displayName: 'Delete Products',
      description: 'Can delete or archive products',
      category: PermissionCategory.PRODUCTS,
    },

    // CATEGORIES
    {
      name: 'categories.view',
      displayName: 'View Categories',
      description: 'Can view categories',
      category: PermissionCategory.CATEGORIES,
    },
    {
      name: 'categories.create',
      displayName: 'Create Categories',
      description: 'Can create categories',
      category: PermissionCategory.CATEGORIES,
    },
    {
      name: 'categories.update',
      displayName: 'Update Categories',
      description: 'Can update categories',
      category: PermissionCategory.CATEGORIES,
    },
    {
      name: 'categories.delete',
      displayName: 'Delete Categories',
      description: 'Can delete categories',
      category: PermissionCategory.CATEGORIES,
    },

    // BRANDS
    {
      name: 'brands.view',
      displayName: 'View Brands',
      description: 'Can view brands',
      category: PermissionCategory.BRANDS,
    },
    {
      name: 'brands.create',
      displayName: 'Create Brands',
      description: 'Can create brands',
      category: PermissionCategory.BRANDS,
    },
    {
      name: 'brands.update',
      displayName: 'Update Brands',
      description: 'Can update brands',
      category: PermissionCategory.BRANDS,
    },
    {
      name: 'brands.delete',
      displayName: 'Delete Brands',
      description: 'Can delete brands',
      category: PermissionCategory.BRANDS,
    },

    // ORDERS
    {
      name: 'orders.view_own',
      displayName: 'View Own Orders',
      description: 'Customers can view their own orders',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'orders.view_all',
      displayName: 'View All Orders',
      description: 'Can view all customer orders',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'orders.update',
      displayName: 'Update Orders',
      description: 'Can update order status and details',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'orders.cancel',
      displayName: 'Cancel Orders',
      description: 'Can cancel orders',
      category: PermissionCategory.ORDERS,
    },

    // CUSTOMERS
    {
      name: 'customers.view',
      displayName: 'View Customers',
      description: 'Can view customer accounts',
      category: PermissionCategory.CUSTOMERS,
    },
    {
      name: 'customers.update',
      displayName: 'Update Customers',
      description: 'Can update customer details',
      category: PermissionCategory.CUSTOMERS,
    },
    {
      name: 'customers.disable',
      displayName: 'Disable Customers',
      description: 'Can disable customer accounts',
      category: PermissionCategory.CUSTOMERS,
    },

    // STAFF
    {
      name: 'staff.view',
      displayName: 'View Staff',
      description: 'Can view staff accounts',
      category: PermissionCategory.STAFF,
    },
    {
      name: 'staff.create',
      displayName: 'Create Staff',
      description: 'Can create staff accounts',
      category: PermissionCategory.STAFF,
    },
    {
      name: 'staff.update',
      displayName: 'Update Staff',
      description: 'Can update staff accounts',
      category: PermissionCategory.STAFF,
    },
    {
      name: 'staff.disable',
      displayName: 'Disable Staff',
      description: 'Can disable staff accounts',
      category: PermissionCategory.STAFF,
    },
    {
      name: 'staff.permissions',
      displayName: 'Manage Staff Permissions',
      description: 'Can assign or remove staff permissions',
      category: PermissionCategory.STAFF,
    },

    // SETTINGS
    {
      name: 'settings.view',
      displayName: 'View Settings',
      description: 'Can view platform settings',
      category: PermissionCategory.SETTINGS,
    },
    {
      name: 'settings.update',
      displayName: 'Update Settings',
      description: 'Can update platform settings',
      category: PermissionCategory.SETTINGS,
    },

    // ANALYTICS
    {
      name: 'analytics.view',
      displayName: 'View Analytics',
      description: 'Can view dashboard analytics',
      category: PermissionCategory.ANALYTICS,
    },
  ];

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

  // ============================================
  // STEP 3: ROLE DEFAULT PERMISSIONS
  // ============================================
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

  console.log('🎉 Zemlo database seed completed successfully');
}

// ============================================
// RUN SEED
// ============================================
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
