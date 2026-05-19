import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStripePaymentIntentDto } from './dto/create-stripe-payment-intent.dto.js';
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
}
