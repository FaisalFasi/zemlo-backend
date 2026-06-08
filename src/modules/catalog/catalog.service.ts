import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const publicProductListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  trackInventory: true,
  allowBackorder: true,
  hasVariants: true,
  isFeatured: true,
  keywords: true,
  metaTitle: true,
  metaDescription: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  },
  images: {
    where: {
      isDefault: true,
    },
    orderBy: {
      position: Prisma.SortOrder.asc,
    },
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
      isDefault: true,
    },
    take: 1,
  },
  variants: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      trackInventory: true,
      allowBackorder: true,
      image: true,
      options: true,
    },
  },
} satisfies Prisma.ProductSelect;

const publicProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  trackInventory: true,
  allowBackorder: true,
  hasVariants: true,
  isFeatured: true,
  weight: true,
  length: true,
  width: true,
  height: true,
  keywords: true,
  metaTitle: true,
  metaDescription: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      website: true,
    },
  },
  images: {
    orderBy: {
      position: Prisma.SortOrder.asc,
    },
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
      isDefault: true,
    },
  },
  variants: {
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      trackInventory: true,
      allowBackorder: true,
      image: true,
      options: true,
    },
  },
} satisfies Prisma.ProductSelect;

type PublicProductListItem = Prisma.ProductGetPayload<{
  select: typeof publicProductListSelect;
}>;

type PublicProductDetail = Prisma.ProductGetPayload<{
  select: typeof publicProductDetailSelect;
}>;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findProducts() {
    const products = await this.prisma.product.findMany({
      where: this.getActiveProductWhere(),
      orderBy: [
        {
          isFeatured: Prisma.SortOrder.desc,
        },
        {
          createdAt: Prisma.SortOrder.desc,
        },
      ],
      select: publicProductListSelect,
    });

    return products.map((product) => this.toPublicProductListItem(product));
  }

  async findProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        ...this.getActiveProductWhere(),
      },
      select: publicProductDetailSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toPublicProductDetail(product);
  }

  async findCategories() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      orderBy: [
        {
          position: Prisma.SortOrder.asc,
        },
        {
          name: Prisma.SortOrder.asc,
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        children: {
          where: {
            isActive: true,
          },
          orderBy: [
            {
              position: Prisma.SortOrder.asc,
            },
            {
              name: Prisma.SortOrder.asc,
            },
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            parentId: true,
          },
        },
      },
    });
  }

  async findBrands() {
    return this.prisma.brand.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        website: true,
      },
    });
  }

  private getActiveProductWhere(): Prisma.ProductWhereInput {
    return {
      status: ProductStatus.ACTIVE,
      category: {
        isActive: true,
      },
      OR: [
        {
          brandId: null,
        },
        {
          brand: {
            isActive: true,
          },
        },
      ],
    };
  }

  private toPublicProductListItem(product: PublicProductListItem) {
    return {
      ...product,
      price: this.toNumber(product.price),
      compareAtPrice: this.toNullableNumber(product.compareAtPrice),
      variants: product.variants.map((variant) => ({
        ...variant,
        price: this.toNullableNumber(variant.price),
        compareAtPrice: this.toNullableNumber(variant.compareAtPrice),
      })),
    };
  }

  private toPublicProductDetail(product: PublicProductDetail) {
    return {
      ...product,
      price: this.toNumber(product.price),
      compareAtPrice: this.toNullableNumber(product.compareAtPrice),
      weight: this.toNullableNumber(product.weight),
      length: this.toNullableNumber(product.length),
      width: this.toNullableNumber(product.width),
      height: this.toNullableNumber(product.height),
      variants: product.variants.map((variant) => ({
        ...variant,
        price: this.toNullableNumber(variant.price),
        compareAtPrice: this.toNullableNumber(variant.compareAtPrice),
      })),
    };
  }

  private toNumber(value: Prisma.Decimal | number | string) {
    return Number(value);
  }

  private toNullableNumber(
    value: Prisma.Decimal | number | string | null | undefined,
  ) {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }
}
