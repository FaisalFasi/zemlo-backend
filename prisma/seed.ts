// ============================================
// IMPORT SECTION
// ============================================
import { PrismaClient, UserRole, PermissionCategory } from '@prisma/client';
import { prismaPGAdapter } from './adapter/prismaPGAdapter';

// WHY: @prisma/client is auto-generated when you run "npx prisma generate"
// It contains:
// - PrismaClient: The database connection object
// - UserRole: Your enum (CUSTOMER, SELLER, ADMIN)
// - PermissionCategory: Your enum (PRODUCTS, ORDERS, etc.)

// Adapter banayo
const adapter = prismaPGAdapter();

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'], // Shows SQL queries in console (helps learning)
});

// WHY: This creates a connection pool to PostgreSQL
// Think of it like opening a phone line to your database
// You use "prisma" to talk to the database

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function main() {
  // WHY "async"?
  // Because database operations take time (they're not instant)
  // "async" lets us use "await" to wait for operations to complete

  console.log('🌱 Starting to seed database...');

  // ============================================
  // STEP 1: CREATE ALL PERMISSIONS
  // ============================================

  // WHY: We define permissions FIRST because:
  // 1. Users will need to reference these permissions
  // 2. Roles will need to reference these permissions
  // It's like building the foundation before the house

  const permissionsData = [
    // ========================================
    // PRODUCTS CATEGORY
    // ========================================
    {
      name: 'view_products', // Unique identifier (used in code)
      displayName: 'View Products', // Human-readable (shown in UI)
      description: 'Can view product listings',
      category: PermissionCategory.PRODUCTS, // Groups related permissions
    },
    {
      name: 'manage_own_products',
      displayName: 'Manage Own Products',
      description: 'Create, edit, delete own products (for sellers)',
      category: PermissionCategory.PRODUCTS,
    },
    {
      name: 'manage_all_products',
      displayName: 'Manage All Products',
      description: 'Manage ANY product on platform (admin power)',
      category: PermissionCategory.PRODUCTS,
    },
    {
      name: 'approve_products',
      displayName: 'Approve Products',
      description: 'Approve/reject new product listings (content moderation)',
      category: PermissionCategory.PRODUCTS,
    },

    // ========================================
    // ORDERS CATEGORY
    // ========================================
    {
      name: 'view_own_orders',
      displayName: 'View Own Orders',
      description: 'View orders you placed as customer',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'manage_store_orders',
      displayName: 'Manage Store Orders',
      description: 'Manage orders for products you sell',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'view_all_orders',
      displayName: 'View All Orders',
      description: 'View ANY order on platform (admin/support)',
      category: PermissionCategory.ORDERS,
    },
    {
      name: 'process_refunds',
      displayName: 'Process Refunds',
      description: 'Approve and process customer refunds',
      category: PermissionCategory.ORDERS,
    },

    // ========================================
    // USERS CATEGORY
    // ========================================
    {
      name: 'view_users',
      displayName: 'View Users',
      description: 'View user profiles and information',
      category: PermissionCategory.USERS,
    },
    {
      name: 'ban_users',
      displayName: 'Ban Users',
      description: 'Ban/suspend/delete user accounts',
      category: PermissionCategory.USERS,
    },
    {
      name: 'manage_permissions',
      displayName: 'Manage Permissions',
      description: 'Grant or revoke permissions to users',
      category: PermissionCategory.USERS,
    },

    // ========================================
    // FINANCE CATEGORY
    // ========================================
    {
      name: 'view_own_earnings',
      displayName: 'View Own Earnings',
      description: 'See how much money you made from sales',
      category: PermissionCategory.FINANCE,
    },
    {
      name: 'view_all_transactions',
      displayName: 'View All Transactions',
      description: 'See ALL money flowing through platform',
      category: PermissionCategory.FINANCE,
    },
    {
      name: 'process_payouts',
      displayName: 'Process Payouts',
      description: 'Send money to sellers',
      category: PermissionCategory.FINANCE,
    },

    // ========================================
    // CONTENT CATEGORY
    // ========================================
    {
      name: 'moderate_reviews',
      displayName: 'Moderate Reviews',
      description: 'Remove fake/inappropriate reviews',
      category: PermissionCategory.CONTENT,
    },
    {
      name: 'moderate_products',
      displayName: 'Moderate Products',
      description: 'Flag counterfeit/illegal products',
      category: PermissionCategory.CONTENT,
    },

    // ========================================
    // SETTINGS CATEGORY
    // ========================================
    {
      name: 'manage_settings',
      displayName: 'Manage Settings',
      description: 'Configure platform settings (danger zone!)',
      category: PermissionCategory.SETTINGS,
    },

    // ========================================
    // ANALYTICS CATEGORY
    // ========================================
    {
      name: 'view_analytics',
      displayName: 'View Analytics',
      description: 'See platform statistics and charts',
      category: PermissionCategory.ANALYTICS,
    },
  ];

  // ============================================
  // LOOP THROUGH AND CREATE EACH PERMISSION
  // ============================================
  console.log('📝 Creating permissions in database...');

  for (const permData of permissionsData) {
    // WHY "upsert" instead of "create"?
    // - If permission already exists (from previous seed), UPDATE it
    // - If it doesn't exist, CREATE it
    // This makes the seed script SAFE to run multiple times

    await prisma.permission.upsert({
      where: { name: permData.name }, // Find by unique "name" field
      update: {}, // If exists, don't change anything (empty update)
      create: permData, // If doesn't exist, create with this data
    });
  }

  console.log(`✅ Created/verified ${permissionsData.length} permissions`);

  // ============================================
  // STEP 2: ASSIGN DEFAULT PERMISSIONS TO ROLES
  // ============================================

  // WHY: When someone registers as CUSTOMER/SELLER/ADMIN,
  // we automatically give them these permissions
  // Think of it like: "Every ADMIN gets these keys by default"

  const rolePermissionsMap = {
    // ========================================
    // CUSTOMER ROLE
    // ========================================
    CUSTOMER: [
      'view_products', // Can browse the store
      'view_own_orders', // Can see orders they placed
    ],
    // WHY SO LIMITED?
    // Customers shouldn't manage products, ban users, etc.
    // Security principle: "Least privilege" - only what they need

    // ========================================
    // SELLER ROLE
    // ========================================
    SELLER: [
      'view_products', // Can browse (like customer)
      'view_own_orders', // Can see their customer orders
      'manage_own_products', // Can add/edit THEIR products
      'manage_store_orders', // Can fulfill orders for THEIR products
      'view_own_earnings', // Can see how much they earned
    ],
    // WHY: Sellers manage their OWN stuff, not other sellers' stuff
    // They can't see platform finances or ban users

    // ========================================
    // ADMIN ROLE (YOU!)
    // ========================================
    ADMIN: [
      // ALL PERMISSIONS - Copy every permission name from above
      'view_products',
      'manage_own_products',
      'manage_all_products', // Can edit ANY product
      'approve_products',
      'view_own_orders',
      'manage_store_orders',
      'view_all_orders', // Can see ALL orders
      'process_refunds',
      'view_users',
      'ban_users', // Can ban anyone
      'manage_permissions', // Can grant permissions
      'view_own_earnings',
      'view_all_transactions', // Can see ALL money
      'process_payouts',
      'moderate_reviews',
      'moderate_products',
      'manage_settings', // Can change platform settings
      'view_analytics',
    ],
    // WHY ALL PERMISSIONS?
    // You're the platform owner - you need full control
    // This makes you AUTONOMOUS (no one else needed)
  };

  // ============================================
  // LOOP THROUGH ROLES AND ASSIGN PERMISSIONS
  // ============================================
  console.log('🔗 Assigning permissions to roles...');

  for (const [roleName, permissionNames] of Object.entries(
    rolePermissionsMap,
  )) {
    // "Object.entries" converts object to array:
    // { CUSTOMER: [...] } becomes [['CUSTOMER', [...]]]

    for (const permName of permissionNames) {
      // Find the permission in database
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (!permission) {
        console.warn(`⚠️  Permission "${permName}" not found, skipping...`);
        continue; // Skip if permission doesn't exist
      }

      // Create the role-permission link
      await prisma.rolePermission.upsert({
        where: {
          // Composite unique key: role + permissionId
          role_permissionId: {
            role: roleName as UserRole,
            permissionId: permission.id,
          },
        },
        update: {}, // If exists, don't change
        create: {
          role: roleName as UserRole,
          permissionId: permission.id,
        },
      });
    }

    console.log(`  ✅ ${roleName} role configured`);
  }

  console.log('🎉 Database seeding completed successfully!');

  // initialize platform settings with default values
  // In seed.ts or first-time setup
  await prisma.platformSettings.create({
    data: {
      allowPublicSellerRegistration: false, // Start as your own store
      requireSellerApproval: true,
      commissionRate: 0, // No commission initially
      allowGuestCheckout: true, // Guest checkout enabled
      requireEmailVerification: false, // No email verification initially
      storeName: 'Your Store Name',
      storeEmail: 'support@yourstore.com',
    },
  });
}

// ============================================
// RUN THE MAIN FUNCTION
// ============================================
main()
  .catch((error) => {
    // If anything goes wrong, show the error
    console.error('❌ Seeding failed:', error);
    process.exit(1); // Exit with error code
  })
  .finally(async () => {
    // Whether success or failure, disconnect from database
    // WHY: Prevents hanging connections that waste resources
    await prisma.$disconnect();
  });
