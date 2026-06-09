import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';

import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import { toNullableNumber, toNumber } from '../../../common/utils/decimal.util';

@Injectable()
export class CheckoutSettingsService {
  validateGuestCheckout(
    isGuest: boolean,
    settings: Prisma.PlatformSettingsGetPayload<object> | null,
  ) {
    if (isGuest && settings?.allowGuestCheckout === false) {
      throw new ForbiddenException('Guest checkout is currently disabled');
    }
  }

  async validatePaymentMethod(
    tx: PrismaTransactionClient,
    paymentMethod: PaymentMethod,
    orderTotal: number,
  ) {
    const paymentSetting = await tx.paymentMethodSetting.findUnique({
      where: {
        method: paymentMethod,
      },
    });

    if (!paymentSetting) {
      throw new BadRequestException('Payment method is not configured');
    }

    if (!paymentSetting.isEnabled) {
      throw new BadRequestException(
        'This payment method is currently disabled',
      );
    }

    if (paymentSetting.isOnline && paymentMethod !== PaymentMethod.STRIPE) {
      throw new BadRequestException(
        'This online payment method is not available yet',
      );
    }

    if (paymentSetting.minAmount !== null) {
      const minAmount = toNumber(paymentSetting.minAmount);

      if (orderTotal < minAmount) {
        throw new BadRequestException(
          `Minimum order amount for this payment method is ${minAmount}`,
        );
      }
    }

    if (paymentSetting.maxAmount !== null) {
      const maxAmount = toNumber(paymentSetting.maxAmount);

      if (orderTotal > maxAmount) {
        throw new BadRequestException(
          `Maximum order amount for this payment method is ${maxAmount}`,
        );
      }
    }

    return paymentSetting;
  }

  getCurrency(
    settings: Prisma.PlatformSettingsGetPayload<object> | null,
  ): string {
    return settings?.currency ?? 'USD';
  }

  getTaxRate(
    settings: Prisma.PlatformSettingsGetPayload<object> | null,
  ): number {
    return settings?.taxRate ? toNumber(settings.taxRate) : 0;
  }

  getDefaultShippingCost(
    settings: Prisma.PlatformSettingsGetPayload<object> | null,
  ): number {
    return settings?.defaultShippingCost
      ? toNumber(settings.defaultShippingCost)
      : 0;
  }

  getFreeShippingOver(
    settings: Prisma.PlatformSettingsGetPayload<object> | null,
  ): number | null {
    return toNullableNumber(settings?.freeShippingOver);
  }
}
