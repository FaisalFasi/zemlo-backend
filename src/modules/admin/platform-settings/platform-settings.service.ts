import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.getOrCreateSettings();

    return this.toSettingsResponse(settings);
  }

  async updateSettings(dto: UpdatePlatformSettingsDto, adminUserId: string) {
    const settings = await this.getOrCreateSettings();

    const data: Prisma.PlatformSettingsUpdateInput = {
      ...this.cleanEmptyStrings(dto),
      updatedBy: adminUserId,
    };

    const updatedSettings = await this.prisma.platformSettings.update({
      where: {
        id: settings.id,
      },
      data,
    });

    return this.toSettingsResponse(updatedSettings);
  }

  private async getOrCreateSettings() {
    const existingSettings = await this.prisma.platformSettings.findUnique({
      where: {
        id: 'default',
      },
    });

    if (existingSettings) {
      return existingSettings;
    }

    return this.prisma.platformSettings.create({
      data: {
        id: 'default',
      },
    });
  }

  private cleanEmptyStrings(dto: UpdatePlatformSettingsDto) {
    const data = { ...dto };

    for (const key of Object.keys(data)) {
      const value = data[key as keyof UpdatePlatformSettingsDto];

      if (typeof value === 'string' && value.trim() === '') {
        data[key as keyof UpdatePlatformSettingsDto] = null as never;
      }

      if (typeof value === 'string' && value.trim() !== '') {
        data[key as keyof UpdatePlatformSettingsDto] = value.trim() as never;
      }
    }

    return data;
  }

  private toSettingsResponse(settings: any) {
    return {
      ...settings,
      taxRate: this.toNumber(settings.taxRate),
      defaultShippingCost: this.toNumber(settings.defaultShippingCost),
      freeShippingOver: this.toNullableNumber(settings.freeShippingOver),
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
