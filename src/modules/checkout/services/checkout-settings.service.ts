import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class CheckoutSettingsService {
  validateGuestCheckout(isGuest: boolean, settings: any) {
    if (isGuest && settings?.allowGuestCheckout === false) {
      throw new ForbiddenException('Guest checkout is currently disabled');
    }
  }
  async validatePaymentMethod(
    tx: any,
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
    if (paymentSetting.isOnline) {
      throw new BadRequestException(
        'Online payment methods are not available yet',
      );
    }

    if (
      paymentSetting.minAmount !== null &&
      orderTotal < Number(paymentSetting.minAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount for this payment method is ${paymentSetting.minAmount}`,
      );
    }

    if (
      paymentSetting.maxAmount !== null &&
      orderTotal > Number(paymentSetting.maxAmount)
    ) {
      throw new BadRequestException(
        `Maximum order amount for this payment method is ${paymentSetting.maxAmount}`,
      );
    }

    return paymentSetting;
  }

  getCurrency(settings: any): string {
    return settings?.currency ?? 'USD';
  }

  getTaxRate(settings: any): number {
    return settings?.taxRate ? Number(settings.taxRate) : 0;
  }

  getDefaultShippingCost(settings: any): number {
    return settings?.defaultShippingCost
      ? Number(settings.defaultShippingCost)
      : 0;
  }

  getFreeShippingOver(settings: any): number | null {
    return settings?.freeShippingOver
      ? Number(settings.freeShippingOver)
      : null;
  }
}
