import { PrismaClient } from '@prisma/client';

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function seedCategories(prisma: PrismaClient) {
  console.log('📁 Creating default categories...');

  const parentCategories = [
    {
      name: 'Men',
      description: 'Clothing, shoes, and accessories for men.',
      position: 1,
    },
    {
      name: 'Women',
      description: 'Clothing, shoes, and accessories for women.',
      position: 2,
    },
    {
      name: 'Kids',
      description: 'Clothing, shoes, and accessories for kids.',
      position: 3,
    },
    {
      name: 'Accessories',
      description: 'Watches, sunglasses, jewelry, and fashion accessories.',
      position: 4,
    },
    {
      name: 'Bags',
      description: 'Backpacks, handbags, wallets, and travel bags.',
      position: 5,
    },
    {
      name: 'Sale',
      description: 'Discounted and sale products.',
      position: 6,
    },
    {
      name: 'New Arrivals',
      description: 'Latest products added to the store.',
      position: 7,
    },
  ];

  const createdParents: Record<string, string> = {};

  for (const category of parentCategories) {
    const slug = toSlug(category.name);

    const createdCategory = await prisma.category.upsert({
      where: {
        slug,
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        position: category.position,
        parentId: null,
      },
      create: {
        name: category.name,
        slug,
        description: category.description,
        isActive: true,
        position: category.position,
        parentId: null,
      },
    });

    createdParents[category.name] = createdCategory.id;
  }

  const childCategories = [
    // MEN
    {
      name: 'T-Shirts',
      parentName: 'Men',
      description: 'Men t-shirts and casual tops.',
      position: 1,
    },
    {
      name: 'Hoodies',
      parentName: 'Men',
      description: 'Men hoodies and sweatshirts.',
      position: 2,
    },
    {
      name: 'Jackets',
      parentName: 'Men',
      description: 'Men jackets and outerwear.',
      position: 3,
    },
    {
      name: 'Jeans',
      parentName: 'Men',
      description: 'Men jeans and denim.',
      position: 4,
    },
    {
      name: 'Shoes',
      parentName: 'Men',
      description: 'Men sneakers, boots, and footwear.',
      position: 5,
    },

    // WOMEN
    {
      name: 'Dresses',
      parentName: 'Women',
      description: 'Women dresses and outfits.',
      position: 1,
    },
    {
      name: 'Tops',
      parentName: 'Women',
      description: 'Women tops and shirts.',
      position: 2,
    },
    {
      name: 'Hoodies',
      parentName: 'Women',
      description: 'Women hoodies and sweatshirts.',
      position: 3,
    },
    {
      name: 'Jeans',
      parentName: 'Women',
      description: 'Women jeans and denim.',
      position: 4,
    },
    {
      name: 'Shoes',
      parentName: 'Women',
      description: 'Women sneakers, boots, and footwear.',
      position: 5,
    },

    // KIDS
    {
      name: 'Boys',
      parentName: 'Kids',
      description: 'Clothing and fashion for boys.',
      position: 1,
    },
    {
      name: 'Girls',
      parentName: 'Kids',
      description: 'Clothing and fashion for girls.',
      position: 2,
    },
    {
      name: 'Shoes',
      parentName: 'Kids',
      description: 'Kids sneakers, boots, and footwear.',
      position: 3,
    },

    // ACCESSORIES
    {
      name: 'Watches',
      parentName: 'Accessories',
      description: 'Watches and timepieces.',
      position: 1,
    },
    {
      name: 'Sunglasses',
      parentName: 'Accessories',
      description: 'Sunglasses and eyewear.',
      position: 2,
    },
    {
      name: 'Jewelry',
      parentName: 'Accessories',
      description: 'Jewelry and fashion accessories.',
      position: 3,
    },

    // BAGS
    {
      name: 'Backpacks',
      parentName: 'Bags',
      description: 'Backpacks and daily carry bags.',
      position: 1,
    },
    {
      name: 'Handbags',
      parentName: 'Bags',
      description: 'Handbags and fashion bags.',
      position: 2,
    },
    {
      name: 'Wallets',
      parentName: 'Bags',
      description: 'Wallets and small leather goods.',
      position: 3,
    },
  ];

  for (const category of childCategories) {
    const parentId = createdParents[category.parentName];

    if (!parentId) {
      console.warn(`⚠️ Parent category "${category.parentName}" not found`);
      continue;
    }

    const slug = `${toSlug(category.parentName)}-${toSlug(category.name)}`;

    await prisma.category.upsert({
      where: {
        slug,
      },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
        position: category.position,
        parentId,
      },
      create: {
        name: category.name,
        slug,
        description: category.description,
        isActive: true,
        position: category.position,
        parentId,
      },
    });
  }

  console.log(
    `✅ Created/verified ${
      parentCategories.length + childCategories.length
    } categories`,
  );
}
