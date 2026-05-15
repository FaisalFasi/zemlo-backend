import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto';

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string) {
    await this.validateProduct(productId);

    return this.prisma.productVariant.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
    });
  }

  async create(productId: string, dto: CreateProductVariantDto) {
    await this.validateProduct(productId);
    await this.validateUniqueSku(dto.sku);

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name.trim(),
        sku: dto.sku?.trim(),
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        costPrice: dto.costPrice ?? null,
        stock: dto.stock ?? 0,
        trackInventory: dto.trackInventory ?? true,
        allowBackorder: dto.allowBackorder ?? false,
        isActive: dto.isActive ?? true,
        image: dto.image?.trim() || null,
        options: dto.options ?? {},
      },
    });

    await this.syncProductHasVariants(productId);

    return variant;
  }

  async update(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    await this.validateProduct(productId);
    await this.validateVariant(productId, variantId);

    if (dto.sku !== undefined) {
      await this.validateUniqueSku(dto.sku, variantId);
    }

    const data: Prisma.ProductVariantUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.sku !== undefined) {
      const normalizedSku = dto.sku.trim();

      if (!normalizedSku) {
        throw new BadRequestException('SKU cannot be empty');
      }

      data.sku = normalizedSku;
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

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.image !== undefined) {
      data.image = dto.image?.trim() || null;
    }

    if (dto.options !== undefined) {
      data.options = dto.options;
    }

    return this.prisma.productVariant.update({
      where: {
        id: variantId,
      },
      data,
    });
  }

  async remove(productId: string, variantId: string) {
    await this.validateProduct(productId);
    await this.validateVariant(productId, variantId);

    await this.prisma.productVariant.delete({
      where: {
        id: variantId,
      },
    });

    await this.syncProductHasVariants(productId);

    return {
      message: 'Product variant deleted successfully',
    };
  }

  private async validateProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async validateVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
      },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  private async validateUniqueSku(sku: string, ignoreVariantId?: string) {
    const normalizedSku = sku.trim();

    if (!normalizedSku) {
      throw new BadRequestException('SKU is required');
    }

    const existingVariant = await this.prisma.productVariant.findUnique({
      where: {
        sku: normalizedSku,
      },
    });

    if (existingVariant && existingVariant.id !== ignoreVariantId) {
      throw new BadRequestException('Variant SKU already exists');
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: {
        sku: normalizedSku,
      },
    });

    if (existingProduct) {
      throw new BadRequestException('SKU already exists on another product');
    }
  }

  private async syncProductHasVariants(productId: string) {
    const variantCount = await this.prisma.productVariant.count({
      where: {
        productId,
      },
    });

    await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        hasVariants: variantCount > 0,
      },
    });
  }
}
