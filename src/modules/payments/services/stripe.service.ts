import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripePaymentIntentResult = {
  id: string;
  clientSecret: string | null;
  status: string;
};

@Injectable()
export class StripeService {
  private readonly stripeClient: InstanceType<typeof Stripe> | null;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');

    this.stripeClient = secretKey ? new Stripe(secretKey) : null;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata: Record<string, string>;
  }): Promise<StripePaymentIntentResult> {
    const stripeClient = this.getStripeClient();

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: this.toStripeAmount(params.amount),
      currency: params.currency.toLowerCase(),
      metadata: params.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<StripePaymentIntentResult> {
    const stripeClient = this.getStripeClient();

    const paymentIntent =
      await stripeClient.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  }

  private getStripeClient(): InstanceType<typeof Stripe> {
    if (!this.stripeClient) {
      throw new BadRequestException(
        'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.',
      );
    }

    return this.stripeClient;
  }

  private toStripeAmount(amount: number) {
    return Math.round(amount * 100);
  }
}
