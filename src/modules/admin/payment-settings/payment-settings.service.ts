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
    const existingSetting = await this.findOne(method);

    const finalMinAmount =
      dto.minAmount !== undefined
        ? dto.minAmount
        : existingSetting.minAmount !== null
          ? Number(existingSetting.minAmount)
          : null;

    const finalMaxAmount =
      dto.maxAmount !== undefined
        ? dto.maxAmount
        : existingSetting.maxAmount !== null
          ? Number(existingSetting.maxAmount)
          : null;

    if (
      finalMinAmount !== null &&
      finalMaxAmount !== null &&
      finalMinAmount > finalMaxAmount
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
