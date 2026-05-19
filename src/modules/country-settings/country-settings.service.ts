import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCountrySettingDto, UpdateCountrySettingDto } from './dto';

@Injectable()
export class CountrySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.countrySetting.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async create(dto: CreateCountrySettingDto) {
    const data = this.normalizeCreateDto(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.countrySetting.updateMany({
          where: {
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      try {
        return await tx.countrySetting.create({
          data,
        });
      } catch (error) {
        this.handlePrismaError(error);
      }
    });
  }

  async update(id: string, dto: UpdateCountrySettingDto) {
    const existingCountry = await this.prisma.countrySetting.findUnique({
      where: {
        id,
      },
    });

    if (!existingCountry) {
      throw new NotFoundException('Country setting not found');
    }

    const data = this.normalizeUpdateDto(dto);

    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.countrySetting.updateMany({
          where: {
            isDefault: true,
            id: {
              not: id,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      try {
        return await tx.countrySetting.update({
          where: {
            id,
          },
          data,
        });
      } catch (error) {
        this.handlePrismaError(error);
      }
    });
  }

  async remove(id: string) {
    const existingCountry = await this.prisma.countrySetting.findUnique({
      where: {
        id,
      },
    });

    if (!existingCountry) {
      throw new NotFoundException('Country setting not found');
    }

    if (existingCountry.isDefault) {
      throw new BadRequestException(
        'Default country cannot be deleted. Set another country as default first.',
      );
    }

    await this.prisma.countrySetting.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Country setting deleted successfully',
    };
  }

  private normalizeCreateDto(dto: CreateCountrySettingDto) {
    return {
      name: dto.name.trim(),
      iso2: dto.iso2.trim().toUpperCase(),
      iso3: dto.iso3?.trim().toUpperCase() || null,
      currency: dto.currency?.trim().toUpperCase() || null,
      phoneCode: dto.phoneCode?.trim() || null,

      isActive: dto.isActive ?? true,
      allowWebsiteAccess: dto.allowWebsiteAccess ?? true,
      allowCheckout: dto.allowCheckout ?? true,
      allowShipping: dto.allowShipping ?? true,

      isDefault: dto.isDefault ?? false,
      sortOrder: dto.sortOrder ?? 0,
    };
  }

  private normalizeUpdateDto(dto: UpdateCountrySettingDto) {
    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.iso2 !== undefined) {
      data.iso2 = dto.iso2.trim().toUpperCase();
    }

    if (dto.iso3 !== undefined) {
      data.iso3 = dto.iso3?.trim().toUpperCase() || null;
    }

    if (dto.currency !== undefined) {
      data.currency = dto.currency?.trim().toUpperCase() || null;
    }

    if (dto.phoneCode !== undefined) {
      data.phoneCode = dto.phoneCode?.trim() || null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.allowWebsiteAccess !== undefined) {
      data.allowWebsiteAccess = dto.allowWebsiteAccess;
    }

    if (dto.allowCheckout !== undefined) {
      data.allowCheckout = dto.allowCheckout;
    }

    if (dto.allowShipping !== undefined) {
      data.allowShipping = dto.allowShipping;
    }

    if (dto.isDefault !== undefined) {
      data.isDefault = dto.isDefault;
    }

    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }

    return data;
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'Country with this ISO code already exists',
      );
    }

    throw error;
  }
}
