import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  OrderInventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

import { AppModule } from '../src/app.module';
import { OrderInventoryLifecycleService } from '../src/modules/orders/services/order-inventory-lifecycle.service';
import { StripeService } from '../src/modules/payments/services/stripe.service';
import { PrismaService } from '../src/prisma/prisma.service';

const logger = new Logger('ReleaseExpiredInventoryReservations');

const cancellableStripeStatuses = new Set([
  'requires_payment_method',
  'requires_capture',
  'requires_confirmation',
  'requires_action',
]);

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function getLimit(): number {
  const rawLimit = getArgValue('limit');

  if (!rawLimit) {
    return 50;
  }

  const limit = Number(rawLimit);

  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    throw new Error('--limit must be an integer between 1 and 500');
  }

  return limit;
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prisma = app.get(PrismaService);
  const stripeService = app.get(StripeService);
  const orderInventoryLifecycleService = app.get(
    OrderInventoryLifecycleService,
  );

  const limit = getLimit();
  const dryRun = isDryRun();
  const now = new Date();

  const expiredOrders = await prisma.order.findMany({
    where: {
      inventoryStatus: OrderInventoryStatus.RESERVED,
      paymentStatus: PaymentStatus.PENDING,
      inventoryExpiresAt: {
        not: null,
        lte: now,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      payment: {
        select: {
          id: true,
          method: true,
          status: true,
          paymentIntentId: true,
        },
      },
    },
    orderBy: {
      inventoryExpiresAt: 'asc',
    },
    take: limit,
  });

  logger.log(
    `Found ${expiredOrders.length} expired reserved orders. dryRun=${dryRun}`,
  );

  if (dryRun) {
    for (const order of expiredOrders) {
      logger.log(`DRY RUN: would release order ${order.orderNumber}`);
    }

    await app.close();
    return;
  }

  let releasedCount = 0;
  let skippedCount = 0;

  for (const order of expiredOrders) {
    try {
      if (
        order.payment?.method === PaymentMethod.STRIPE &&
        order.payment.paymentIntentId
      ) {
        const stripeIntent = await stripeService.retrievePaymentIntent(
          order.payment.paymentIntentId,
        );

        if (stripeIntent.status === 'succeeded') {
          skippedCount += 1;
          logger.warn(
            `Skipped ${order.orderNumber}; Stripe PaymentIntent already succeeded.`,
          );
          continue;
        }

        if (stripeIntent.status === 'processing') {
          skippedCount += 1;
          logger.warn(
            `Skipped ${order.orderNumber}; Stripe PaymentIntent is still processing.`,
          );
          continue;
        }

        if (cancellableStripeStatuses.has(stripeIntent.status)) {
          await stripeService.cancelPaymentIntent(
            order.payment.paymentIntentId,
          );
        }

        if (
          stripeIntent.status !== 'canceled' &&
          !cancellableStripeStatuses.has(stripeIntent.status)
        ) {
          skippedCount += 1;
          logger.warn(
            `Skipped ${order.orderNumber}; Stripe PaymentIntent status is ${stripeIntent.status}.`,
          );
          continue;
        }
      }

      const released = await prisma.$transaction(async (tx) => {
        const wasReleased =
          await orderInventoryLifecycleService.releaseReservedInventory(tx, {
            orderId: order.id,
            orderStatus: OrderStatus.EXPIRED,
            paymentStatus: PaymentStatus.EXPIRED,
            note: 'Reserved inventory expired and was released automatically.',
            releasedAt: now,
          });

        if (wasReleased) {
          await tx.payment.updateMany({
            where: {
              orderId: order.id,
              status: PaymentStatus.PENDING,
            },
            data: {
              status: PaymentStatus.EXPIRED,
              expiredAt: now,
            },
          });
        }

        return wasReleased;
      });

      if (released) {
        releasedCount += 1;
        logger.log(`Released expired reservation for ${order.orderNumber}`);
      } else {
        skippedCount += 1;
        logger.warn(
          `Skipped ${order.orderNumber}; inventory was no longer RESERVED.`,
        );
      }
    } catch (error) {
      skippedCount += 1;
      logger.error(
        `Failed to release ${order.orderNumber}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  logger.log(
    `Expired reservation cleanup complete. released=${releasedCount}, skipped=${skippedCount}`,
  );

  await app.close();
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
