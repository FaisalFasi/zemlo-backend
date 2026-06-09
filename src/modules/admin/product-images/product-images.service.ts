import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductImageDto, UpdateProductImageDto } from './dto';

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string) {
    await this.validateProduct(productId);

    return this.prisma.productImage.findMany({
      where: {
        productId,
      },
      orderBy: {
        position: Prisma.SortOrder.asc,
      },
    });
  }

  async create(productId: string, dto: CreateProductImageDto) {
    await this.validateProduct(productId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.productImage.updateMany({
          where: {
            productId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const image = await tx.productImage.create({
        data: {
          productId,
          url: dto.url.trim(),
          altText: dto.altText?.trim() || null,
          position: dto.position ?? 0,
          isDefault: dto.isDefault ?? false,
        },
      });

      await this.ensureProductHasDefaultImage(tx, productId);

      return image;
    });
  }

  async update(productId: string, imageId: string, dto: UpdateProductImageDto) {
    await this.validateProduct(productId);
    await this.validateImage(productId, imageId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.productImage.updateMany({
          where: {
            productId,
            id: {
              not: imageId,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const data: Prisma.ProductImageUpdateInput = {};

      if (dto.url !== undefined) {
        data.url = dto.url.trim();
      }

      if (dto.altText !== undefined) {
        data.altText = dto.altText?.trim() || null;
      }

      if (dto.position !== undefined) {
        data.position = dto.position;
      }

      if (dto.isDefault !== undefined) {
        data.isDefault = dto.isDefault;
      }

      const image = await tx.productImage.update({
        where: {
          id: imageId,
        },
        data,
      });

      await this.ensureProductHasDefaultImage(tx, productId);

      return image;
    });
  }

  async setDefault(productId: string, imageId: string) {
    await this.validateProduct(productId);
    await this.validateImage(productId, imageId);

    return this.prisma.$transaction(async (tx) => {
      await tx.productImage.updateMany({
        where: {
          productId,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.productImage.update({
        where: {
          id: imageId,
        },
        data: {
          isDefault: true,
        },
      });
    });
  }

  async remove(productId: string, imageId: string) {
    await this.validateProduct(productId);
    await this.validateImage(productId, imageId);

    return this.prisma.$transaction(async (tx) => {
      await tx.productImage.delete({
        where: {
          id: imageId,
        },
      });

      await this.ensureProductHasDefaultImage(tx, productId);

      return {
        message: 'Product image deleted successfully',
      };
    });
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

  private async validateImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    return image;
  }

  private async ensureProductHasDefaultImage(
    tx: PrismaTransactionClient,
    productId: string,
  ) {
    const defaultImage = await tx.productImage.findFirst({
      where: {
        productId,
        isDefault: true,
      },
    });

    if (defaultImage) {
      return;
    }

    const firstImage = await tx.productImage.findFirst({
      where: {
        productId,
      },
      orderBy: {
        position: Prisma.SortOrder.asc,
      },
    });

    if (!firstImage) {
      return;
    }

    await tx.productImage.update({
      where: {
        id: firstImage.id,
      },
      data: {
        isDefault: true,
      },
    });
  }
}
