import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.getOrCreateSettings();
  }

  async updateSettings(dto: UpdatePlatformSettingsDto, adminUserId: string) {
    const settings = await this.getOrCreateSettings();

    const data: Prisma.PlatformSettingsUpdateInput = {
      ...this.cleanEmptyStrings(dto),
      updatedBy: adminUserId,
    };

    return this.prisma.platformSettings.update({
      where: {
        id: settings.id,
      },
      data,
    });
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
}
