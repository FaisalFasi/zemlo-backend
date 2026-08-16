import { Inject, Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

import {
  OrderInventoryLifecycleService,
  type ExpiredReservationOrderRef,
} from '../../orders/services/order-inventory-lifecycle.service';
import { StripeService } from './stripe.service';

const CANCELLABLE_STRIPE_STATUSES = new Set([
  'requires_payment_method',
  'requires_capture',
  'requires_confirmation',
  'requires_action',
]);

export type ExpiredReservationReleaseResult = {
  checkedCount: number;
  releasedCount: number;
  skippedCount: number;
  dryRun: boolean;
};

/**
 * Single source of truth for releasing expired inventory reservations. Both
 * the cron job (`InventoryReleaseCron`) and the manual CLI script
 * (`scripts/release-expired-inventory-reservations.ts`) call this so the
 * Stripe-reconciliation safety check can't drift between the two call sites.
 */
@Injectable()
export class ExpiredReservationReleaseService {
  private readonly logger = new Logger(ExpiredReservationReleaseService.name);

  constructor(
    @Inject(OrderInventoryLifecycleService)
    private readonly orderInventoryLifecycle: OrderInventoryLifecycleService,
    @Inject(StripeService)
    private readonly stripeService: StripeService,
  ) {}

  async release(params?: {
    limit?: number;
    dryRun?: boolean;
    now?: Date;
  }): Promise<ExpiredReservationReleaseResult> {
    return this.orderInventoryLifecycle.releaseExpiredReservations({
      ...params,
      shouldRelease: (order) => this.canRelease(order),
    });
  }

  /**
   * An order can only be safely marked EXPIRED if Stripe hasn't actually
   * succeeded/is-processing the payment in parallel with the reservation
   * expiring — otherwise a paid order would have its stock released back
   * to sale. Non-Stripe orders (bank transfer, manual, etc.) have no
   * external state to reconcile, so they're always releasable.
   */
  private async canRelease(
    order: ExpiredReservationOrderRef,
  ): Promise<boolean> {
    if (
      order.payment?.method !== PaymentMethod.STRIPE ||
      !order.payment.paymentIntentId
    ) {
      return true;
    }

    try {
      const paymentIntent = await this.stripeService.retrievePaymentIntent(
        order.payment.paymentIntentId,
      );

      if (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing'
      ) {
        this.logger.warn(
          `Skipped ${order.orderNumber}; Stripe PaymentIntent status is ${paymentIntent.status}.`,
        );
        return false;
      }

      if (CANCELLABLE_STRIPE_STATUSES.has(paymentIntent.status)) {
        await this.stripeService.cancelPaymentIntent(
          order.payment.paymentIntentId,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reconcile Stripe PaymentIntent for ${order.orderNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
