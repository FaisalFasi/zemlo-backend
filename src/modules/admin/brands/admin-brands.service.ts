import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAdminBrandDto, UpdateAdminBrandDto } from './dto';

@Injectable()
export class AdminBrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: {
        id,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
          take: 20,
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return brand;
  }

  async create(dto: CreateAdminBrandDto) {
    const slug = this.toSlug(dto.slug || dto.name);

    await this.validateUniqueSlug(slug);

    return this.prisma.brand.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        logo: dto.logo?.trim() || null,
        website: dto.website?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateAdminBrandDto) {
    const existingBrand = await this.prisma.brand.findUnique({
      where: {
        id,
      },
    });

    if (!existingBrand) {
      throw new NotFoundException('Brand not found');
    }

    const data: Prisma.BrandUpdateInput = {};

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

    if (dto.logo !== undefined) {
      data.logo = dto.logo?.trim() || null;
    }

    if (dto.website !== undefined) {
      data.website = dto.website?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.brand.update({
      where: {
        id,
      },
      data,
    });
  }

  async disable(id: string) {
    const existingBrand = await this.prisma.brand.findUnique({
      where: {
        id,
      },
    });

    if (!existingBrand) {
      throw new NotFoundException('Brand not found');
    }

    await this.prisma.brand.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Brand disabled successfully',
    };
  }

  private async validateUniqueSlug(slug: string, ignoreBrandId?: string) {
    const existingBrand = await this.prisma.brand.findUnique({
      where: {
        slug,
      },
    });

    if (existingBrand && existingBrand.id !== ignoreBrandId) {
      throw new BadRequestException('Brand slug already exists');
    }
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
