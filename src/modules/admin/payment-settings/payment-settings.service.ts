import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePaymentMethodSettingDto } from './dto';

@Injectable()
export class PaymentSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.paymentMethodSetting.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(method: PaymentMethod) {
    const setting = await this.prisma.paymentMethodSetting.findUnique({
      where: {
        method,
      },
    });

    if (!setting) {
      throw new NotFoundException('Payment method setting not found');
    }

    return setting;
  }

  async update(method: PaymentMethod, dto: UpdatePaymentMethodSettingDto) {
    await this.findOne(method);

    if (
      dto.minAmount !== undefined &&
      dto.maxAmount !== undefined &&
      dto.minAmount > dto.maxAmount
    ) {
      throw new BadRequestException(
        'Minimum amount cannot be greater than maximum amount',
      );
    }

    return this.prisma.paymentMethodSetting.update({
      where: {
        method,
      },
      data: this.cleanDto(dto),
    });
  }

  private cleanDto(dto: UpdatePaymentMethodSettingDto) {
    const data: Record<string, unknown> = { ...dto };

    for (const key of Object.keys(data)) {
      const value = data[key];

      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        data[key] = trimmedValue === '' ? null : trimmedValue;
      }
    }

    return data;
  }
}
