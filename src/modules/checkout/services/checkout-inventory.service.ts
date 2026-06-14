import { BadRequestException, Injectable } from '@nestjs/common';

import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import type { CheckoutLine } from '../types/checkout.types';

@Injectable()
export class CheckoutInventoryService {
  async reserveStock(tx: PrismaTransactionClient, line: CheckoutLine) {
    if (!line.trackInventory) {
      return;
    }

    if (line.variantId) {
      const result = await tx.productVariant.updateMany({
        where: {
          id: line.variantId,
          ...(line.allowBackorder
            ? {}
            : {
                stock: {
                  gte: line.quantity,
                },
              }),
        },
        data: {
          stock: {
            decrement: line.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new BadRequestException(
          `${line.name} selected variant is out of stock`,
        );
      }

      return;
    }

    const result = await tx.product.updateMany({
      where: {
        id: line.productId,
        ...(line.allowBackorder
          ? {}
          : {
              stock: {
                gte: line.quantity,
              },
            }),
      },
      data: {
        stock: {
          decrement: line.quantity,
        },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(`${line.name} is out of stock`);
    }
  }

  async releaseStock(tx: PrismaTransactionClient, line: CheckoutLine) {
    if (!line.trackInventory) {
      return;
    }

    if (line.variantId) {
      await tx.productVariant.update({
        where: {
          id: line.variantId,
        },
        data: {
          stock: {
            increment: line.quantity,
          },
        },
      });

      return;
    }

    await tx.product.update({
      where: {
        id: line.productId,
      },
      data: {
        stock: {
          increment: line.quantity,
        },
      },
    });
  }

  async releaseOrderStock(
    tx: PrismaTransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                trackInventory: true,
                allowBackorder: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                trackInventory: true,
                allowBackorder: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found for stock release');
    }

    for (const item of order.items) {
      const trackInventory =
        item.variant?.trackInventory ?? item.product.trackInventory;

      if (!trackInventory) {
        continue;
      }

      if (item.variantId) {
        await tx.productVariant.update({
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

      await tx.product.update({
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
