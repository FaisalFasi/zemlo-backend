import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

import { prismaPGAdapter } from './adapter/prismaPGAdapter';
import { seedTestCatalog } from './seeds/test-catalog.seed';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('❌ DATABASE_URL missing in test catalog seed');
}

const prisma = new PrismaClient({
  adapter: prismaPGAdapter(databaseUrl),
  log: ['error', 'warn'],
});

async function main() {
  console.log('Starting Zemlo temporary test catalog seed...');

  await seedTestCatalog(prisma);

  console.log('✅ Zemlo temporary test catalog seed completed successfully');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Test catalog seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
