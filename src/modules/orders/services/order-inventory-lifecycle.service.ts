import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OrderInventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import { PrismaService } from '../../../prisma/prisma.service';

type CommitReservedInventoryParams = {
  orderId: string;
  committedAt?: Date;
};

type ReleaseReservedInventoryParams = {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  note: string;
  changedBy?: string | null;
  releasedAt?: Date;
};

export type ExpiredReservationOrderRef = {
  id: string;
  orderNumber: string;
  payment: {
    method: PaymentMethod;
    paymentIntentId: string | null;
  } | null;
};

@Injectable()
export class OrderInventoryLifecycleService {
  private readonly logger = new Logger(OrderInventoryLifecycleService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async commitReservedInventory(
    tx: PrismaTransactionClient,
    params: CommitReservedInventoryParams,
  ): Promise<boolean> {
    const committedAt = params.committedAt ?? new Date();

    const result = await tx.order.updateMany({
      where: {
        id: params.orderId,
        inventoryStatus: OrderInventoryStatus.RESERVED,
      },
      data: {
        inventoryStatus: OrderInventoryStatus.COMMITTED,
        inventoryCommittedAt: committedAt,
        inventoryExpiresAt: null,
      },
    });

    return result.count > 0;
  }

  async releaseReservedInventory(
    tx: PrismaTransactionClient,
    params: ReleaseReservedInventoryParams,
  ): Promise<boolean> {
    const releasedAt = params.releasedAt ?? new Date();

    const result = await tx.order.updateMany({
      where: {
        id: params.orderId,
        inventoryStatus: OrderInventoryStatus.RESERVED,
      },
      data: {
        status: params.orderStatus,
        ...(params.paymentStatus
          ? {
              paymentStatus: params.paymentStatus,
            }
          : {}),
        inventoryStatus: OrderInventoryStatus.RELEASED,
        inventoryReleasedAt: releasedAt,
        inventoryExpiresAt: null,
        ...(params.orderStatus === OrderStatus.CANCELLED
          ? {
              cancelledAt: releasedAt,
            }
          : {}),
        ...(params.orderStatus === OrderStatus.EXPIRED
          ? {
              expiredAt: releasedAt,
            }
          : {}),
      },
    });

    if (result.count === 0) {
      return false;
    }

    await this.restoreOrderStock(tx, params.orderId);

    await tx.orderStatusHistory.create({
      data: {
        orderId: params.orderId,
        status: params.orderStatus,
        note: params.note,
        changedBy: params.changedBy ?? null,
      },
    });

    return true;
  }

  /**
   * `shouldRelease` lets a caller veto releasing a specific order (e.g. the
   * payments module checks the live Stripe PaymentIntent status first) without
   * this module depending on payment-provider code. Defaults to "always release".
   */
  async releaseExpiredReservations(params?: {
    limit?: number;
    dryRun?: boolean;
    now?: Date;
    shouldRelease?: (order: ExpiredReservationOrderRef) => Promise<boolean>;
  }): Promise<{
    checkedCount: number;
    releasedCount: number;
    skippedCount: number;
    dryRun: boolean;
  }> {
    const now = params?.now ?? new Date();
    const limit = params?.limit ?? 50;
    const dryRun = params?.dryRun ?? false;
    const shouldRelease = params?.shouldRelease;

    const orders = await this.prisma.order.findMany({
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
            method: true,
            paymentIntentId: true,
          },
        },
      },
      orderBy: {
        inventoryExpiresAt: 'asc',
      },
      take: limit,
    });

    if (dryRun) {
      return {
        checkedCount: orders.length,
        releasedCount: 0,
        skippedCount: 0,
        dryRun: true,
      };
    }

    let releasedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        if (shouldRelease && !(await shouldRelease(order))) {
          skippedCount += 1;
          continue;
        }

        const released = await this.prisma.$transaction(async (tx) => {
          const wasReleased = await this.releaseReservedInventory(tx, {
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
        } else {
          skippedCount += 1;
        }
      } catch (error) {
        skippedCount += 1;
        this.logger.error(
          `Failed to release ${order.orderNumber}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      checkedCount: orders.length,
      releasedCount,
      skippedCount,
      dryRun: false,
    };
  }

  private async restoreOrderStock(
    tx: PrismaTransactionClient,
    orderId: string,
  ): Promise<void> {
    const items = await tx.orderItem.findMany({
      where: {
        orderId,
      },
      include: {
        product: {
          select: {
            id: true,
            trackInventory: true,
          },
        },
        variant: {
          select: {
            id: true,
            trackInventory: true,
          },
        },
      },
    });

    for (const item of items) {
      const trackInventory =
        item.variant?.trackInventory ?? item.product.trackInventory;

      if (!trackInventory) {
        continue;
      }

      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        continue;
      }

      await tx.product.updateMany({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }
}
