import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripePaymentIntentResult = {
  id: string;
  clientSecret: string | null;
  status: string;
};

export type StripeWebhookPaymentIntent = {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  latestCharge: string | null;
  metadata: Record<string, string>;
};

export type StripePaymentIntentWebhookEvent = {
  kind: 'paymentIntent';
  type:
    | 'payment_intent.succeeded'
    | 'payment_intent.payment_failed'
    | 'payment_intent.canceled';
  paymentIntent: StripeWebhookPaymentIntent;
};

export type StripeIgnoredWebhookEvent = {
  kind: 'ignored';
  type: string;
  paymentIntent: null;
};

export type StripeWebhookEvent =
  | StripePaymentIntentWebhookEvent
  | StripeIgnoredWebhookEvent;

@Injectable()
export class StripeService {
  private readonly stripeClient: InstanceType<typeof Stripe> | null;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
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

  constructWebhookEvent(params: {
    rawBody: Buffer;
    signature: string;
  }): StripeWebhookEvent {
    const stripeClient = this.getStripeClient();

    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );

    if (!webhookSecret) {
      throw new BadRequestException(
        'Stripe webhook secret is not configured. Please add STRIPE_WEBHOOK_SECRET to your .env file.',
      );
    }

    const event = stripeClient.webhooks.constructEvent(
      params.rawBody,
      params.signature,
      webhookSecret,
    );

    if (
      this.isPaymentIntentEventType(event.type) &&
      this.isStripePaymentIntent(event.data.object)
    ) {
      return {
        kind: 'paymentIntent',
        type: event.type,
        paymentIntent: this.toWebhookPaymentIntent(event.data.object),
      };
    }

    return {
      kind: 'ignored',
      type: event.type,
      paymentIntent: null,
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

  private toStripeAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  private isPaymentIntentEventType(
    eventType: string,
  ): eventType is StripePaymentIntentWebhookEvent['type'] {
    return (
      eventType === 'payment_intent.succeeded' ||
      eventType === 'payment_intent.payment_failed' ||
      eventType === 'payment_intent.canceled'
    );
  }

  private isStripePaymentIntent(value: unknown): value is Record<
    string,
    unknown
  > & {
    id: string;
    object: string;
    amount: number;
    currency: string;
    status: string;
    metadata: Record<string, string>;
  } {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id === 'string' &&
      typeof value.object === 'string' &&
      typeof value.amount === 'number' &&
      typeof value.currency === 'string' &&
      typeof value.status === 'string' &&
      this.isStringRecord(value.metadata)
    );
  }

  private toWebhookPaymentIntent(
    paymentIntent: Record<string, unknown> & {
      id: string;
      object: string;
      amount: number;
      currency: string;
      status: string;
      metadata: Record<string, string>;
    },
  ): StripeWebhookPaymentIntent {
    return {
      id: paymentIntent.id,
      object: paymentIntent.object,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: this.toNullableStripeReference(
        paymentIntent.payment_method,
      ),
      latestCharge: this.toNullableStripeReference(paymentIntent.latest_charge),
      metadata: paymentIntent.metadata,
    };
  }

  private toNullableStripeReference(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (this.isRecord(value) && typeof value.id === 'string') {
      return value.id;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isStringRecord(value: unknown): value is Record<string, string> {
    if (!this.isRecord(value)) {
      return false;
    }

    return Object.values(value).every((item) => typeof item === 'string');
  }

  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<StripePaymentIntentResult> {
    const stripeClient = this.getStripeClient();
    const paymentIntent =
      await stripeClient.paymentIntents.cancel(paymentIntentId);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  }
}
