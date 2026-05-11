import { Injectable } from '@nestjs/common';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { CheckoutLine, CheckoutTotals } from '../types/checkout.types';
import { generateOrderNumber } from '../helpers/checkout-order.helper';

@Injectable()
export class CheckoutOrderService {
  async createOrderWithItemsAndPayment(
    tx: any,
    params: {
      userId?: string;
      isGuest: boolean;
      dto: any;
      lines: CheckoutLine[];
      totals: CheckoutTotals;
      shippingAddressId: string;
      billingAddressId: string;
      currency: string;
    },
  ) {
    const {
      userId,
      isGuest,
      dto,
      lines,
      totals,
      shippingAddressId,
      billingAddressId,
      currency,
    } = params;

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),

        userId: userId ?? null,

        guestEmail: isGuest ? dto.guestEmail.toLowerCase().trim() : null,
        guestPhone: isGuest ? dto.guestPhone.trim() : null,
        guestFirstName: isGuest ? dto.guestFirstName.trim() : null,
        guestLastName: isGuest ? dto.guestLastName.trim() : null,

        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,

        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,

        shippingAddressId,
        billingAddressId,

        customerNote: dto.customerNote?.trim() || null,
      },
    });

    await tx.orderItem.createMany({
      data: lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        variantId: line.variantId ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        productSnapshot: line.productSnapshot,
      })),
    });

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        amount: totals.total,
        currency,
        method: dto.paymentMethod,
        status: PaymentStatus.PENDING,
        metadata: {
          checkoutType: isGuest ? 'guest' : 'authenticated',
        },
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.PENDING,
        note: 'Order created from checkout',
        changedBy: userId ?? null,
      },
    });

    return {
      order,
      payment,
    };
  }
}
