import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateStripePaymentIntentDto } from './dto';
import { StripeService } from './services/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
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
        gatewayResponse: paymentIntent as any,
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

    if (event.type === 'payment_intent.succeeded') {
      return this.handlePaymentIntentSucceeded(event.data.object);
    }

    if (event.type === 'payment_intent.payment_failed') {
      return this.handlePaymentIntentFailed(event.data.object);
    }

    return {
      received: true,
      ignored: true,
      eventType: event.type,
    };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any) {
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

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.PAID,
          gatewayResponse: paymentIntent,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
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

  private async handlePaymentIntentFailed(paymentIntent: any) {
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

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: paymentIntent,
        },
      });

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
          note: 'Payment failed via Stripe',
        },
      });
    });

    return {
      received: true,
      paymentStatus: PaymentStatus.FAILED,
    };
  }
}
