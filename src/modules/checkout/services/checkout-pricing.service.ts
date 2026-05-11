import { Injectable } from '@nestjs/common';
import { CheckoutLine, CheckoutTotals } from '../types/checkout.types';
import { roundMoney } from '../helpers/checkout-money.helper';

@Injectable()
export class CheckoutPricingService {
  calculateTotals(params: {
    lines: CheckoutLine[];
    taxRate?: number;
    shippingCost?: number;
    discount?: number;
  }): CheckoutTotals {
    const { lines, taxRate = 0, shippingCost = 0, discount = 0 } = params;

    const subtotal = roundMoney(
      lines.reduce((sum, line) => sum + line.totalPrice, 0),
    );

    const tax = roundMoney(subtotal * (taxRate / 100));
    const finalShippingCost = roundMoney(shippingCost);
    const finalDiscount = roundMoney(discount);

    const total = roundMoney(
      subtotal + tax + finalShippingCost - finalDiscount,
    );

    return {
      subtotal,
      tax,
      shippingCost: finalShippingCost,
      discount: finalDiscount,
      total,
    };
  }
}
