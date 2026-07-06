import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

import { prismaPGAdapter } from './adapter/prismaPGAdapter';
import { seedCategories } from './seeds/categories.seed';
import { seedCountries } from './seeds/countries.seed';
import { seedPaymentMethods } from './seeds/payment-method.seed';
import { seedPermissions } from './seeds/permissions.seed';
import { seedPlatformSettings } from './seeds/platform-settings.seed';
import { seedRolePermissions } from './seeds/role-permissions.seed';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('❌ DATABASE_URL missing in seed');
}

const prisma = new PrismaClient({
  adapter: prismaPGAdapter(databaseUrl),
  log: ['error', 'warn'],
});

async function main() {
  console.log('Starting Zemlo core database seed...');

  await seedPlatformSettings(prisma);
  await seedCountries(prisma);
  await seedPaymentMethods(prisma);
  await seedCategories(prisma);
  await seedPermissions(prisma);
  await seedRolePermissions(prisma);

  console.log('✅ Zemlo core database seed completed successfully');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Core database seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
