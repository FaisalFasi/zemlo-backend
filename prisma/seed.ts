import { PrismaClient } from '@prisma/client';
import { prismaPGAdapter } from './adapter/prismaPGAdapter';
import 'dotenv/config';

import { seedPlatformSettings } from './seeds/platform-settings.seed';
import { seedCountries } from './seeds/countries.seed';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRolePermissions } from './seeds/role-permissions.seed';
import { seedTestCatalog } from './seeds/test-catalog.seed';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('❌ DATABASE_URL missing in seed');
}

const prisma = new PrismaClient({
  adapter: prismaPGAdapter(databaseUrl),
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log('🌱 Starting Zemlo database seed...');

  await seedPlatformSettings(prisma);
  await seedCountries(prisma);

  await seedPermissions(prisma);
  await seedRolePermissions(prisma);

  await seedTestCatalog(prisma);

  console.log('🎉 Zemlo database seed completed successfully');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
