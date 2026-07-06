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
  StripeWebhookEventStatus,
} from '@prisma/client';
import { OrderInventoryLifecycleService } from '../orders/services/order-inventory-lifecycle.service';

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

  async createStripePaymentIntent(
    dto: CreateStripePaymentIntentDto,
    requesterUserId?: string,
  ) {
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

    this.assertOrderPaymentAccess(order, requesterUserId, dto.guestEmail);

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
      amount: Number(order.payment.amount),
      currency: order.payment.currency,
      idempotencyKey: `zemlo:payment-intent:${order.payment.id}`,
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
  private assertOrderPaymentAccess(
    order: {
      userId: string | null;
      guestEmail: string | null;
    },
    requesterUserId: string | undefined,
    providedGuestEmail: string | undefined,
  ): void {
    if (order.userId) {
      if (!requesterUserId || requesterUserId !== order.userId) {
        throw new NotFoundException('Order not found');
      }

      return;
    }

    const storedGuestEmail = order.guestEmail?.trim().toLowerCase();

    const normalizedProvidedEmail = providedGuestEmail?.trim().toLowerCase();

    if (
      !storedGuestEmail ||
      !normalizedProvidedEmail ||
      storedGuestEmail !== normalizedProvidedEmail
    ) {
      throw new NotFoundException('Order not found');
    }
  }

  async handleStripeWebhook(params: { rawBody: Buffer; signature: string }) {
    const event = this.stripeService.constructWebhookEvent(params);

    const existingEvent = await this.prisma.stripeWebhookEvent.findUnique({
      where: {
        stripeEventId: event.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingEvent?.status === StripeWebhookEventStatus.PROCESSED) {
      return {
        received: true,
        duplicate: true,
        eventType: event.type,
      };
    }

    if (existingEvent?.status === StripeWebhookEventStatus.PROCESSING) {
      return {
        received: true,
        duplicate: true,
        processing: true,
        eventType: event.type,
      };
    }

    const eventRecord = existingEvent
      ? await this.prisma.stripeWebhookEvent.update({
          where: {
            stripeEventId: event.id,
          },
          data: {
            status: StripeWebhookEventStatus.PROCESSING,
            failureReason: null,
          },
        })
      : await this.prisma.stripeWebhookEvent.create({
          data: {
            stripeEventId: event.id,
            eventType: event.type,
            objectId: event.paymentIntent?.id ?? null,
            paymentIntentId: event.paymentIntent?.id ?? null,
            status: StripeWebhookEventStatus.PROCESSING,
            payload: this.toStripeWebhookEventPayload(event),
          },
        });

    try {
      let result: Record<string, unknown>;

      if (event.kind === 'paymentIntent') {
        if (event.type === 'payment_intent.succeeded') {
          result = await this.handlePaymentIntentSucceeded(event.paymentIntent);
        } else if (event.type === 'payment_intent.payment_failed') {
          result = await this.handlePaymentIntentFailed(event.paymentIntent);
        } else if (event.type === 'payment_intent.canceled') {
          result = await this.handlePaymentIntentCanceled(event.paymentIntent);
        } else {
          result = {
            received: true,
            ignored: true,
            eventType: event.type,
          };
        }
      } else {
        result = {
          received: true,
          ignored: true,
          eventType: event.type,
        };
      }

      await this.prisma.stripeWebhookEvent.update({
        where: {
          id: eventRecord.id,
        },
        data: {
          status:
            result['ignored'] === true
              ? StripeWebhookEventStatus.IGNORED
              : StripeWebhookEventStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      await this.prisma.stripeWebhookEvent.update({
        where: {
          id: eventRecord.id,
        },
        data: {
          status: StripeWebhookEventStatus.FAILED,
          failureReason:
            error instanceof Error ? error.message : 'Unknown webhook error',
        },
      });

      throw error;
    }
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
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    const expectedCurrency = payment.currency.trim().toLowerCase();

    const paymentMatchesOrder =
      paymentIntent.amount === expectedAmount &&
      paymentIntent.currency.trim().toLowerCase() === expectedCurrency &&
      paymentIntent.metadata.paymentId === payment.id &&
      paymentIntent.metadata.orderId === payment.orderId;

    if (!paymentMatchesOrder) {
      throw new BadRequestException(
        'Stripe PaymentIntent does not match the stored payment',
      );
    }

    if (payment.order.inventoryStatus === OrderInventoryStatus.RELEASED) {
      throw new BadRequestException(
        'Cannot mark payment as paid because order inventory was already released',
      );
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
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

    if (payment.status === PaymentStatus.PAID) {
      return {
        received: true,
        message: 'Payment is already marked as paid',
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

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          /*
           * The individual payment attempt failed, but the order remains
           * payable and its inventory reservation remains active.
           */
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status,
          note: 'Stripe payment attempt failed. The customer can retry while inventory remains reserved.',
        },
      });
    });

    return {
      received: true,
      paymentStatus: PaymentStatus.FAILED,
      orderStatus: payment.order.status,
      inventoryStatus: payment.order.inventoryStatus,
      retryable: paymentIntent.status === 'requires_payment_method',
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
  private toStripeWebhookEventPayload(
    event: ReturnType<StripeService['constructWebhookEvent']>,
  ): Prisma.InputJsonObject {
    return {
      id: event.id,
      type: event.type,
      kind: event.kind,
      paymentIntentId: event.paymentIntent?.id ?? null,
      paymentIntentStatus: event.paymentIntent?.status ?? null,
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
}
