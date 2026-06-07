import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpdatePaymentMethodSettingDto } from './dto';

@Injectable()
export class PaymentSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const settings = await this.prisma.paymentMethodSetting.findMany({
      orderBy: {
        sortOrder: Prisma.SortOrder.asc,
      },
    });

    return settings.map((setting) => this.toPaymentMethodResponse(setting));
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

    return this.toPaymentMethodResponse(setting);
  }

  async update(method: PaymentMethod, dto: UpdatePaymentMethodSettingDto) {
    const existingSetting = await this.findOne(method);

    const finalMinAmount =
      dto.minAmount !== undefined ? dto.minAmount : existingSetting.minAmount;

    const finalMaxAmount =
      dto.maxAmount !== undefined ? dto.maxAmount : existingSetting.maxAmount;

    if (
      finalMinAmount !== null &&
      finalMaxAmount !== null &&
      finalMinAmount > finalMaxAmount
    ) {
      throw new BadRequestException(
        'Minimum amount cannot be greater than maximum amount',
      );
    }

    const setting = await this.prisma.paymentMethodSetting.update({
      where: {
        method,
      },
      data: this.cleanDto(dto),
    });

    return this.toPaymentMethodResponse(setting);
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

  private toPaymentMethodResponse(setting: any) {
    return {
      ...setting,
      minAmount: this.toNullableNumber(setting.minAmount),
      maxAmount: this.toNullableNumber(setting.maxAmount),
    };
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
