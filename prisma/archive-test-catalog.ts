import { PrismaClient, ProductStatus } from '@prisma/client';
import 'dotenv/config';

import { prismaPGAdapter } from './adapter/prismaPGAdapter';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('❌ DATABASE_URL missing in test catalog archive');
}

const prisma = new PrismaClient({
  adapter: prismaPGAdapter(databaseUrl),
  log: ['error', 'warn'],
});

async function main() {
  console.log('Archiving Zemlo temporary test catalog...');

  const [products, brand, category] = await prisma.$transaction([
    prisma.product.updateMany({
      where: {
        slug: {
          in: ['test-product', 'lifecycle-test-product'],
        },
      },
      data: {
        status: ProductStatus.ARCHIVED,
        isFeatured: false,
        publishedAt: null,
      },
    }),

    prisma.brand.updateMany({
      where: {
        slug: 'zemlo-test-brand',
      },
      data: {
        isActive: false,
      },
    }),

    prisma.category.updateMany({
      where: {
        slug: 'test-category',
      },
      data: {
        isActive: false,
      },
    }),
  ]);

  console.log(
    `✅ Test catalog archived: products=${products.count}, brands=${brand.count}, categories=${category.count}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('❌ Test catalog archive failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
