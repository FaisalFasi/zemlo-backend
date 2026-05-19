import { PrismaClient, ProductStatus } from '@prisma/client';

export async function seedTestCatalog(prisma: PrismaClient) {
  console.log('🛍️ Creating test catalog data...');

  const testCategory = await prisma.category.upsert({
    where: {
      slug: 'test-category',
    },
    update: {
      name: 'Test Category',
      description: 'Temporary category for testing checkout',
      isActive: true,
      position: 1,
    },
    create: {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Temporary category for testing checkout',
      isActive: true,
      position: 1,
    },
  });

  const testBrand = await prisma.brand.upsert({
    where: {
      slug: 'zemlo-test-brand',
    },
    update: {
      name: 'Zemlo Test Brand',
      description: 'Temporary brand for testing checkout',
      isActive: true,
    },
    create: {
      name: 'Zemlo Test Brand',
      slug: 'zemlo-test-brand',
      description: 'Temporary brand for testing checkout',
      isActive: true,
    },
  });

  const testProduct = await prisma.product.upsert({
    where: {
      slug: 'test-product',
    },
    update: {
      name: 'Test Product',
      description: 'Temporary product for checkout testing',
      shortDescription: 'Test checkout product',
      sku: 'TEST-PRODUCT-001',
      price: 49.99,
      compareAtPrice: 69.99,
      costPrice: 20,
      stock: 100,
      trackInventory: true,
      allowBackorder: false,
      hasVariants: false,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      categoryId: testCategory.id,
      brandId: testBrand.id,
      publishedAt: new Date(),
    },
    create: {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Temporary product for checkout testing',
      shortDescription: 'Test checkout product',
      sku: 'TEST-PRODUCT-001',
      price: 49.99,
      compareAtPrice: 69.99,
      costPrice: 20,
      stock: 100,
      trackInventory: true,
      allowBackorder: false,
      hasVariants: false,
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      categoryId: testCategory.id,
      brandId: testBrand.id,
      publishedAt: new Date(),
    },
  });

  await prisma.productImage.upsert({
    where: {
      id: 'test-product-image-default',
    },
    update: {
      url: 'https://placehold.co/600x600?text=Test+Product',
      altText: 'Test Product',
      position: 1,
      isDefault: true,
      productId: testProduct.id,
    },
    create: {
      id: 'test-product-image-default',
      url: 'https://placehold.co/600x600?text=Test+Product',
      altText: 'Test Product',
      position: 1,
      isDefault: true,
      productId: testProduct.id,
    },
  });

  console.log('✅ Test catalog data ready');
  console.log('🧪 Test product ID:', testProduct.id);
  console.log('🧪 Test product slug:', testProduct.slug);
}
