import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderInventoryStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { OrderInventoryLifecycleService } from './services/order-inventory-lifecycle.service';

import { toNumber } from '../../common/utils/decimal.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GuestOrderLookupDto,
  UpdateAdminOrderShippingDto,
  UpdateAdminOrderStatusDto,
} from './dto';

type OrderResponseSource = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
  };
}>;

type OrderItemResponseSource = OrderResponseSource['items'][number];
type PaymentResponseSource = NonNullable<OrderResponseSource['payment']>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderInventoryLifecycleService: OrderInventoryLifecycleService,
  ) {}
  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async findMyOrderByOrderNumber(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        orderNumber,
      },
      include: this.getOrderDetailsInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toOrderResponse(order);
  }

  async findAllAdminOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        payment: true,
        items: true,
      },
    });

    return orders.map((order) => this.toOrderResponse(order));
  }

  async findAdminOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: this.getOrderDetailsInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toOrderResponse(order);
  }

  async updateAdminOrderStatus(
    id: string,
    dto: UpdateAdminOrderStatusDto,
    adminUserId: string,
  ) {
    if (
      dto.status === undefined &&
      dto.paymentStatus === undefined &&
      dto.fulfillmentStatus === undefined
    ) {
      throw new BadRequestException('At least one status field is required');
    }

    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        payment: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    this.validateAdminOrderStatusUpdate(existingOrder, dto);

    const order = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const updateData: {
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        fulfillmentStatus?: FulfillmentStatus;
        paidAt?: Date | null;
        cancelledAt?: Date | null;
        completedAt?: Date | null;
        expiredAt?: Date | null;
        inventoryStatus?: OrderInventoryStatus;
        inventoryCommittedAt?: Date | null;
        inventoryExpiresAt?: Date | null;
      } = {};

      const paymentUpdateData: {
        status?: PaymentStatus;
        paidAt?: Date | null;
        failedAt?: Date | null;
        cancelledAt?: Date | null;
        expiredAt?: Date | null;
        refundedAt?: Date | null;
      } = {};

      if (dto.status !== undefined) {
        updateData.status = dto.status;

        if (dto.status === OrderStatus.CANCELLED) {
          updateData.cancelledAt = now;
        }

        if (dto.status === OrderStatus.EXPIRED) {
          updateData.expiredAt = now;
        }

        if (dto.status === OrderStatus.DELIVERED) {
          updateData.completedAt = now;
        }
      }

      if (dto.paymentStatus !== undefined) {
        updateData.paymentStatus = dto.paymentStatus;
        paymentUpdateData.status = dto.paymentStatus;

        if (dto.paymentStatus === PaymentStatus.PAID) {
          updateData.paidAt = now;
          paymentUpdateData.paidAt = now;

          if (existingOrder.inventoryStatus === OrderInventoryStatus.RESERVED) {
            updateData.inventoryStatus = OrderInventoryStatus.COMMITTED;
            updateData.inventoryCommittedAt = now;
            updateData.inventoryExpiresAt = null;
          }
        }

        if (dto.paymentStatus === PaymentStatus.FAILED) {
          updateData.paidAt = null;
          paymentUpdateData.paidAt = null;
          paymentUpdateData.failedAt = now;
        }

        if (dto.paymentStatus === PaymentStatus.CANCELLED) {
          updateData.paidAt = null;
          paymentUpdateData.paidAt = null;
          paymentUpdateData.cancelledAt = now;
        }

        if (dto.paymentStatus === PaymentStatus.EXPIRED) {
          updateData.paidAt = null;
          updateData.expiredAt = now;
          paymentUpdateData.paidAt = null;
          paymentUpdateData.expiredAt = now;
        }

        if (dto.paymentStatus === PaymentStatus.REFUNDED) {
          updateData.paidAt = null;
          paymentUpdateData.paidAt = null;
          paymentUpdateData.refundedAt = now;
        }

        if (dto.paymentStatus === PaymentStatus.PENDING) {
          updateData.paidAt = null;
          paymentUpdateData.paidAt = null;
        }
      }

      if (dto.fulfillmentStatus !== undefined) {
        updateData.fulfillmentStatus = dto.fulfillmentStatus;
      }

      const shouldReleaseReservedInventory =
        existingOrder.inventoryStatus === OrderInventoryStatus.RESERVED &&
        dto.status === OrderStatus.CANCELLED &&
        existingOrder.paymentStatus !== PaymentStatus.PAID;

      if (shouldReleaseReservedInventory) {
        const released =
          await this.orderInventoryLifecycleService.releaseReservedInventory(
            tx,
            {
              orderId: id,
              orderStatus: OrderStatus.CANCELLED,
              paymentStatus:
                dto.paymentStatus === undefined
                  ? PaymentStatus.CANCELLED
                  : dto.paymentStatus,
              note:
                dto.note?.trim() ||
                'Order cancelled by admin. Reserved inventory was released.',
              changedBy: adminUserId,
              releasedAt: now,
            },
          );

        if (!released) {
          await tx.order.update({
            where: {
              id,
            },
            data: updateData,
          });
        }

        await tx.payment.updateMany({
          where: {
            orderId: id,
          },
          data: {
            ...paymentUpdateData,
            status:
              dto.paymentStatus === undefined
                ? PaymentStatus.CANCELLED
                : dto.paymentStatus,
            cancelledAt:
              dto.paymentStatus === undefined
                ? now
                : paymentUpdateData.cancelledAt,
          },
        });
      } else {
        await tx.order.update({
          where: {
            id,
          },
          data: updateData,
        });

        if (
          dto.paymentStatus === PaymentStatus.PAID &&
          existingOrder.inventoryStatus === OrderInventoryStatus.RESERVED
        ) {
          await this.orderInventoryLifecycleService.commitReservedInventory(
            tx,
            {
              orderId: id,
              committedAt: now,
            },
          );
        }

        if (dto.paymentStatus !== undefined) {
          await tx.payment.updateMany({
            where: {
              orderId: id,
            },
            data: paymentUpdateData,
          });
        }

        if (dto.status !== undefined) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: id,
              status: dto.status,
              note: dto.note?.trim() || 'Order status updated by admin',
              changedBy: adminUserId,
            },
          });
        }
      }

      return tx.order.findUnique({
        where: {
          id,
        },
        include: this.getOrderDetailsInclude(),
      });
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
  private validateAdminOrderStatusUpdate(
    order: {
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      fulfillmentStatus: FulfillmentStatus;
      inventoryStatus: OrderInventoryStatus;
    },
    dto: UpdateAdminOrderStatusDto,
  ): void {
    if (
      order.status === OrderStatus.DELIVERED &&
      dto.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Delivered orders cannot be cancelled');
    }

    if (
      order.status === OrderStatus.CANCELLED &&
      dto.status !== undefined &&
      dto.status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled orders cannot be moved to another status',
      );
    }

    if (
      order.status === OrderStatus.EXPIRED &&
      dto.status !== undefined &&
      dto.status !== OrderStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Expired orders cannot be moved to another status',
      );
    }

    if (
      order.paymentStatus === PaymentStatus.PAID &&
      dto.paymentStatus !== undefined &&
      dto.paymentStatus !== PaymentStatus.PAID &&
      dto.paymentStatus !== PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'Paid orders cannot be moved back to pending, failed, cancelled, or expired payment status',
      );
    }

    if (
      dto.paymentStatus === PaymentStatus.REFUNDED &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Only paid orders can be marked as refunded',
      );
    }

    if (
      dto.fulfillmentStatus === FulfillmentStatus.FULFILLED &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Unpaid orders cannot be marked as fulfilled',
      );
    }

    if (
      dto.status === OrderStatus.DELIVERED &&
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException(
        'Unpaid orders cannot be marked as delivered',
      );
    }
  }

  async updateAdminOrderShipping(
    id: string,
    dto: UpdateAdminOrderShippingDto,
    adminUserId: string,
  ) {
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const data: {
      shippingMethod?: string | null;
      shippingCarrier?: string | null;
      trackingNumber?: string | null;
      trackingUrl?: string | null;
      estimatedDelivery?: Date | null;
      actualDelivery?: Date | null;
      fulfillmentStatus?: FulfillmentStatus;
    } = {};

    if (dto.shippingMethod !== undefined) {
      data.shippingMethod = dto.shippingMethod?.trim() || null;
    }

    if (dto.shippingCarrier !== undefined) {
      data.shippingCarrier = dto.shippingCarrier?.trim() || null;
    }

    if (dto.trackingNumber !== undefined) {
      data.trackingNumber = dto.trackingNumber?.trim() || null;
    }

    if (dto.trackingUrl !== undefined) {
      data.trackingUrl = dto.trackingUrl?.trim() || null;
    }

    if (dto.estimatedDelivery !== undefined) {
      data.estimatedDelivery = dto.estimatedDelivery
        ? new Date(dto.estimatedDelivery)
        : null;
    }

    if (dto.actualDelivery !== undefined) {
      data.actualDelivery = dto.actualDelivery
        ? new Date(dto.actualDelivery)
        : null;
    }

    if (dto.fulfillmentStatus !== undefined) {
      data.fulfillmentStatus = dto.fulfillmentStatus;
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: {
          id,
        },
        data,
        include: this.getOrderDetailsInclude(),
      });

      if (dto.fulfillmentStatus !== undefined) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: updatedOrder.status,
            note:
              dto.note?.trim() ||
              `Fulfillment updated to ${dto.fulfillmentStatus}`,
            changedBy: adminUserId,
          },
        });
      }

      return updatedOrder;
    });

    return this.toOrderResponse(order);
  }

  async findGuestOrder(dto: GuestOrderLookupDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber: dto.orderNumber.trim(),
        guestEmail: dto.email.toLowerCase().trim(),
        userId: null,
      },
      include: this.getOrderDetailsInclude(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toOrderResponse(order);
  }

  private getOrderDetailsInclude(): Prisma.OrderInclude {
    return {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
      payment: true,
      shippingAddress: true,
      billingAddress: true,
      statusHistory: {
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      },
    };
  }

  private toOrderResponse(order: OrderResponseSource) {
    return {
      ...order,
      subtotal: toNumber(order.subtotal),
      tax: toNumber(order.tax),
      shippingCost: toNumber(order.shippingCost),
      discount: toNumber(order.discount),
      total: toNumber(order.total),
      items: order.items.map((item) => this.toOrderItemResponse(item)),
      payment: order.payment ? this.toPaymentResponse(order.payment) : null,
    };
  }

  private toOrderItemResponse(item: OrderItemResponseSource) {
    return {
      ...item,
      unitPrice: toNumber(item.unitPrice),
      totalPrice: toNumber(item.totalPrice),
    };
  }

  private toPaymentResponse(payment: PaymentResponseSource) {
    return {
      ...payment,
      amount: toNumber(payment.amount),
    };
  }
}
