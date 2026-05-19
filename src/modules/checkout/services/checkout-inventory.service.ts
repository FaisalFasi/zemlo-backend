import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckoutLine } from '../types/checkout.types';

@Injectable()
export class CheckoutInventoryService {
  async decreaseStock(tx: any, line: CheckoutLine) {
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
}
