import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAdminProductDto, UpdateAdminProductDto } from './dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: {
        status: {
          not: ProductStatus.ARCHIVED,
        },
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      include: this.getProductInclude(),
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: this.getProductInclude(),
    });

    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException('Product not found');
    }

    return this.toProductResponse(product);
  }
  async create(dto: CreateAdminProductDto) {
    const slug = this.toSlug(dto.slug || dto.name);

    await this.validateCategory(dto.categoryId);
    await this.validateBrand(dto.brandId);
    await this.validateUniqueSlug(slug);
    await this.validateUniqueSku(dto.sku);

    const status = dto.status ?? ProductStatus.DRAFT;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        shortDescription: dto.shortDescription?.trim() || null,
        sku: dto.sku?.trim() || null,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        costPrice: dto.costPrice ?? null,
        stock: dto.stock ?? 0,
        trackInventory: dto.trackInventory ?? true,
        allowBackorder: dto.allowBackorder ?? false,
        hasVariants: dto.hasVariants ?? false,
        status,
        isFeatured: dto.isFeatured ?? false,
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        weight: dto.weight ?? null,
        length: dto.length ?? null,
        width: dto.width ?? null,
        height: dto.height ?? null,
        keywords: dto.keywords ?? [],
        metaTitle: dto.metaTitle?.trim() || null,
        metaDescription: dto.metaDescription?.trim() || null,
        publishedAt: status === ProductStatus.ACTIVE ? new Date() : null,
        images: dto.images?.length
          ? {
              create: this.normalizeImages(dto.images),
            }
          : undefined,
      },
      include: this.getProductInclude(),
    });

    return this.toProductResponse(product);
  }

  async update(id: string, dto: UpdateAdminProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct || existingProduct.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException('Product not found');
    }

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const slug = this.toSlug(dto.slug);
      await this.validateUniqueSlug(slug, id);
      data.slug = slug;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.shortDescription !== undefined) {
      data.shortDescription = dto.shortDescription?.trim() || null;
    }

    if (dto.sku !== undefined) {
      await this.validateUniqueSku(dto.sku, id);
      data.sku = dto.sku?.trim() || null;
    }

    if (dto.price !== undefined) {
      data.price = dto.price;
    }

    if (dto.compareAtPrice !== undefined) {
      data.compareAtPrice = dto.compareAtPrice ?? null;
    }

    if (dto.costPrice !== undefined) {
      data.costPrice = dto.costPrice ?? null;
    }

    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }

    if (dto.trackInventory !== undefined) {
      data.trackInventory = dto.trackInventory;
    }

    if (dto.allowBackorder !== undefined) {
      data.allowBackorder = dto.allowBackorder;
    }

    if (dto.hasVariants !== undefined) {
      data.hasVariants = dto.hasVariants;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;

      if (
        dto.status === ProductStatus.ACTIVE &&
        existingProduct.publishedAt === null
      ) {
        data.publishedAt = new Date();
      }

      if (dto.status !== ProductStatus.ACTIVE) {
        data.publishedAt = null;
      }
    }

    if (dto.isFeatured !== undefined) {
      data.isFeatured = dto.isFeatured;
    }

    if (dto.categoryId !== undefined) {
      await this.validateCategory(dto.categoryId);
      data.category = {
        connect: {
          id: dto.categoryId,
        },
      };
    }

    if (dto.brandId !== undefined) {
      if (dto.brandId) {
        await this.validateBrand(dto.brandId);
        data.brand = {
          connect: {
            id: dto.brandId,
          },
        };
      } else {
        data.brand = {
          disconnect: true,
        };
      }
    }

    if (dto.weight !== undefined) {
      data.weight = dto.weight ?? null;
    }

    if (dto.length !== undefined) {
      data.length = dto.length ?? null;
    }

    if (dto.width !== undefined) {
      data.width = dto.width ?? null;
    }

    if (dto.height !== undefined) {
      data.height = dto.height ?? null;
    }

    if (dto.keywords !== undefined) {
      data.keywords = dto.keywords;
    }

    if (dto.metaTitle !== undefined) {
      data.metaTitle = dto.metaTitle?.trim() || null;
    }

    if (dto.metaDescription !== undefined) {
      data.metaDescription = dto.metaDescription?.trim() || null;
    }

    const product = await this.prisma.product.update({
      where: {
        id,
      },
      data,
      include: this.getProductInclude(),
    });

    return this.toProductResponse(product);
  }

  async archive(id: string) {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct || existingProduct.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: {
        id,
      },
      data: {
        status: ProductStatus.ARCHIVED,
        publishedAt: null,
      },
    });

    return {
      message: 'Product archived successfully',
    };
  }

  private async validateCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestException('Category is inactive');
    }
  }

  private async validateBrand(brandId?: string) {
    if (!brandId) {
      return;
    }

    const brand = await this.prisma.brand.findUnique({
      where: {
        id: brandId,
      },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    if (!brand.isActive) {
      throw new BadRequestException('Brand is inactive');
    }
  }

  private async validateUniqueSlug(slug: string, ignoreProductId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: {
        slug,
      },
    });

    if (existing && existing.id !== ignoreProductId) {
      throw new BadRequestException('Product slug already exists');
    }
  }

  private async validateUniqueSku(sku?: string, ignoreProductId?: string) {
    if (!sku) {
      return;
    }

    const normalizedSku = sku.trim();

    const existing = await this.prisma.product.findUnique({
      where: {
        sku: normalizedSku,
      },
    });

    if (existing && existing.id !== ignoreProductId) {
      throw new BadRequestException('Product SKU already exists');
    }
  }

  private normalizeImages(images: CreateAdminProductDto['images']) {
    if (!images?.length) {
      return [];
    }

    const hasDefault = images.some((image) => image.isDefault === true);

    return images.map((image, index) => ({
      url: image.url.trim(),
      altText: image.altText?.trim() || null,
      position: image.position ?? index,
      isDefault: hasDefault ? (image.isDefault ?? false) : index === 0,
    }));
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getProductInclude(): Prisma.ProductInclude {
    return {
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
        },
      },
      images: {
        orderBy: {
          position: Prisma.SortOrder.asc,
        },
      },
      variants: {
        orderBy: {
          createdAt: Prisma.SortOrder.asc,
        },
      },
    };
  }

  private toProductResponse(product: any) {
    return {
      ...product,
      price: this.toNumber(product.price),
      compareAtPrice: this.toNullableNumber(product.compareAtPrice),
      costPrice: this.toNullableNumber(product.costPrice),
      weight: this.toNullableNumber(product.weight),
      length: this.toNullableNumber(product.length),
      width: this.toNullableNumber(product.width),
      height: this.toNullableNumber(product.height),
      variants:
        product.variants?.map((variant: any) => ({
          ...variant,
          price: this.toNullableNumber(variant.price),
          compareAtPrice: this.toNullableNumber(variant.compareAtPrice),
        })) ?? [],
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
