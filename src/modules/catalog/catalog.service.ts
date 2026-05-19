import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findProducts() {
    return this.prisma.product.findMany({
      where: {
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
      },
      orderBy: [
        {
          isFeatured: Prisma.SortOrder.desc,
        },
        {
          createdAt: Prisma.SortOrder.desc,
        },
      ],
      select: this.getPublicProductListSelect(),
    });
  }

  async findProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
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
      },
      select: this.getPublicProductDetailSelect(),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
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

  private getPublicProductListSelect(): Prisma.ProductSelect {
    return {
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
    };
  }

  private getPublicProductDetailSelect(): Prisma.ProductSelect {
    return {
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
    };
  }
}
