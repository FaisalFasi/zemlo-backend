import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAdminCategoryDto, UpdateAdminCategoryDto } from './dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: [
        {
          position: Prisma.SortOrder.asc,
        },
        {
          name: Prisma.SortOrder.asc,
        },
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            position: true,
          },
          orderBy: {
            position: Prisma.SortOrder.asc,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            position: true,
          },
          orderBy: {
            position: Prisma.SortOrder.asc,
          },
        },
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

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateAdminCategoryDto) {
    const slug = this.toSlug(dto.slug || dto.name);

    await this.validateUniqueSlug(slug);
    await this.validateParent(dto.parentId);

    return this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        image: dto.image?.trim() || null,
        isActive: dto.isActive ?? true,
        position: dto.position ?? 0,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateAdminCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const data: Prisma.CategoryUpdateInput = {};

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

    if (dto.image !== undefined) {
      data.image = dto.image?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.position !== undefined) {
      data.position = dto.position;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (dto.parentId) {
        await this.validateParent(dto.parentId);

        data.parent = {
          connect: {
            id: dto.parentId,
          },
        };
      } else {
        data.parent = {
          disconnect: true,
        };
      }
    }

    return this.prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  async disable(id: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Category disabled successfully',
    };
  }

  private async validateUniqueSlug(slug: string, ignoreCategoryId?: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        slug,
      },
    });

    if (existingCategory && existingCategory.id !== ignoreCategoryId) {
      throw new BadRequestException('Category slug already exists');
    }
  }

  private async validateParent(parentId?: string) {
    if (!parentId) {
      return;
    }

    const parent = await this.prisma.category.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }

    if (!parent.isActive) {
      throw new BadRequestException('Parent category is inactive');
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
