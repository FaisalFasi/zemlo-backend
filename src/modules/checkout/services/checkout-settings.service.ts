import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class CheckoutSettingsService {
  validateGuestCheckout(isGuest: boolean, settings: any) {
    if (isGuest && settings?.allowGuestCheckout === false) {
      throw new ForbiddenException('Guest checkout is currently disabled');
    }
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
