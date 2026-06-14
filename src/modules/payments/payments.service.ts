import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderInventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { OrderInventoryLifecycleService } from '../orders/services/order-inventory-lifecycle.service';

import { CheckoutInventoryService } from '../checkout/services/checkout-inventory.service';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateStripePaymentIntentDto } from './dto';
import {
  StripeService,
  type StripeWebhookPaymentIntent,
} from './services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly orderInventoryLifecycleService: OrderInventoryLifecycleService,
  ) {}

  async createStripePaymentIntent(dto: CreateStripePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: dto.orderId,
      },
      include: {
        payment: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            productSnapshot: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.payment) {
      throw new BadRequestException('Payment record not found for this order');
    }

    if (order.payment.method !== PaymentMethod.STRIPE) {
      throw new BadRequestException(
        'This order was not created for Stripe payment',
      );
    }

    if (order.payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('This order has already been paid');
    }

    if (order.payment.paymentIntentId) {
      const existingIntent = await this.stripeService.retrievePaymentIntent(
        order.payment.paymentIntentId,
      );

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: order.payment.id,
        paymentIntentId: existingIntent.id,
        clientSecret: existingIntent.clientSecret,
        amount: Number(order.total),
        currency: order.payment.currency,
        status: existingIntent.status,
      };
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: Number(order.total),
      currency: order.payment.currency,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: order.payment.id,
      },
    });

    await this.prisma.payment.update({
      where: {
        id: order.payment.id,
      },
      data: {
        paymentIntentId: paymentIntent.id,
        gatewayResponse: paymentIntent,
        metadata: {
          source: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: order.payment.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amount: Number(order.total),
      currency: order.payment.currency,
      status: paymentIntent.status,
    };
  }

  async handleStripeWebhook(params: { rawBody: Buffer; signature: string }) {
    const event = this.stripeService.constructWebhookEvent(params);

    if (event.kind === 'paymentIntent') {
      if (event.type === 'payment_intent.succeeded') {
        return this.handlePaymentIntentSucceeded(event.paymentIntent);
      }

      if (event.type === 'payment_intent.canceled') {
        return this.handlePaymentIntentCanceled(event.paymentIntent);
      }
      if (event.type === 'payment_intent.payment_failed') {
        return this.handlePaymentIntentFailed(event.paymentIntent);
      }
    }

    return {
      received: true,
      ignored: true,
      eventType: event.type,
    };
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: StripeWebhookPaymentIntent,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return {
        received: true,
        message: 'Payment record not found for PaymentIntent',
      };
    }

    if (payment.status === PaymentStatus.PAID) {
      return {
        received: true,
        message: 'Payment already marked as paid',
      };
    }
    if (payment.order.inventoryStatus === OrderInventoryStatus.RELEASED) {
      throw new BadRequestException(
        'Cannot mark payment as paid because order inventory was already released',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.PAID,
          gatewayResponse: this.toStripePaymentIntentSnapshot(paymentIntent),
          paidAt: now,
        },
      });

      const committed =
        await this.orderInventoryLifecycleService.commitReservedInventory(tx, {
          orderId: payment.orderId,
          committedAt: now,
        });

      if (payment.order.inventoryStatus === OrderInventoryStatus.RELEASED) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: payment.order.status,
            note: 'Stripe payment succeeded after reserved inventory was already released. Manual review required.',
          },
        });
      } else {
        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.CONFIRMED,
            paidAt: now,
            ...(committed
              ? {}
              : {
                  inventoryStatus: OrderInventoryStatus.COMMITTED,
                  inventoryCommittedAt: now,
                  inventoryExpiresAt: null,
                }),
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: OrderStatus.CONFIRMED,
            note: 'Payment succeeded via Stripe',
          },
        });
      }

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
          inventoryStatus: OrderInventoryStatus.COMMITTED,
          inventoryCommittedAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.CONFIRMED,
          note: 'Payment succeeded via Stripe',
        },
      });
    });

    return {
      received: true,
      paymentStatus: PaymentStatus.PAID,
      orderStatus: OrderStatus.CONFIRMED,
    };
  }

  private async handlePaymentIntentFailed(
    paymentIntent: StripeWebhookPaymentIntent,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return {
        received: true,
        message: 'Payment record not found for PaymentIntent',
      };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: this.toStripePaymentIntentSnapshot(paymentIntent),
          failedAt: now,
        },
      });

      const released =
        await this.orderInventoryLifecycleService.releaseReservedInventory(tx, {
          orderId: payment.orderId,
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
          note: 'Payment failed via Stripe. Reserved stock was released.',
          releasedAt: now,
        });

      if (!released) {
        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: payment.order.status,
            note: 'Payment failed via Stripe.',
          },
        });
      }
    });

    return {
      received: true,
      paymentStatus: PaymentStatus.FAILED,
    };
  }

  private toStripePaymentIntentSnapshot(
    paymentIntent: StripeWebhookPaymentIntent,
  ): Prisma.InputJsonObject {
    return {
      id: paymentIntent.id,
      object: paymentIntent.object,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.paymentMethod,
      latestCharge: paymentIntent.latestCharge,
      metadata: paymentIntent.metadata,
    };
  }
  private async handlePaymentIntentCanceled(
    paymentIntent: StripeWebhookPaymentIntent,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        paymentIntentId: paymentIntent.id,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return {
        received: true,
        message: 'Payment record not found for PaymentIntent',
      };
    }

    if (
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.EXPIRED
    ) {
      return {
        received: true,
        message: 'Payment already cancelled or expired',
      };
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.CANCELLED,
          gatewayResponse: this.toStripePaymentIntentSnapshot(paymentIntent),
          cancelledAt: now,
        },
      });

      const released =
        await this.orderInventoryLifecycleService.releaseReservedInventory(tx, {
          orderId: payment.orderId,
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          note: 'Stripe PaymentIntent was cancelled. Reserved stock was released.',
          releasedAt: now,
        });

      if (!released) {
        await tx.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            paymentStatus: PaymentStatus.CANCELLED,
          },
        });
      }
    });

    return {
      received: true,
      paymentStatus: PaymentStatus.CANCELLED,
      orderStatus: OrderStatus.CANCELLED,
    };
  }
}
