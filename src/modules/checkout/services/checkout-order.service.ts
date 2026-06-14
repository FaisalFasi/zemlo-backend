import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderInventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import { generateOrderNumber } from '../helpers/checkout-order.helper';
import {
  CheckoutCustomerDetails,
  CheckoutLine,
  CheckoutTotals,
} from '../types/checkout.types';

@Injectable()
export class CheckoutOrderService {
  async createOrderWithItemsAndPayment(
    tx: PrismaTransactionClient,
    params: {
      userId?: string;
      isGuest: boolean;
      dto: CheckoutCustomerDetails;
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

    const guestDetails = isGuest ? this.getGuestDetails(dto) : null;
    const now = new Date();
    const inventoryExpiresAt = this.getInventoryExpiresAt(
      dto.paymentMethod,
      now,
    );

    // const now = new Date();
    // const inventoryExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),

        userId: userId ?? null,

        guestEmail: guestDetails?.email ?? null,
        guestPhone: guestDetails?.phone ?? null,
        guestFirstName: guestDetails?.firstName ?? null,
        guestLastName: guestDetails?.lastName ?? null,

        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,

        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,

        inventoryStatus: OrderInventoryStatus.RESERVED,
        inventoryReservedAt: now,
        inventoryExpiresAt,

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

  private getGuestDetails(dto: CheckoutCustomerDetails): {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  } {
    const email = dto.guestEmail?.trim();
    const phone = dto.guestPhone?.trim();
    const firstName = dto.guestFirstName?.trim();
    const lastName = dto.guestLastName?.trim();

    if (!email || !phone || !firstName || !lastName) {
      throw new BadRequestException(
        'Guest checkout requires guestEmail, guestPhone, guestFirstName, and guestLastName.',
      );
    }

    return {
      email: email.toLowerCase(),
      phone,
      firstName,
      lastName,
    };
  }
  private getInventoryExpiresAt(
    paymentMethod: PaymentMethod,
    now: Date,
  ): Date | null {
    const oneHour = 60 * 60 * 1000;
    const fortyEightHours = 48 * oneHour;

    if (
      paymentMethod === PaymentMethod.STRIPE ||
      paymentMethod === PaymentMethod.PAYPAL ||
      paymentMethod === PaymentMethod.CREDIT_CARD ||
      paymentMethod === PaymentMethod.DEBIT_CARD
    ) {
      return new Date(now.getTime() + oneHour);
    }

    if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
      return new Date(now.getTime() + fortyEightHours);
    }

    return null;
  }
}
