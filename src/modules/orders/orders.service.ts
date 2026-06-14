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
import { CheckoutInventoryService } from '../checkout/services/checkout-inventory.service';

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
    private readonly checkoutInventoryService: CheckoutInventoryService,
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
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const updateData: {
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        fulfillmentStatus?: FulfillmentStatus;
        inventoryStatus?: OrderInventoryStatus;
        inventoryReleasedAt?: Date;
        inventoryCommittedAt?: Date;
        paidAt?: Date | null;
        cancelledAt?: Date;
        completedAt?: Date;
      } = {};

      if (dto.status !== undefined) {
        updateData.status = dto.status;

        if (dto.status === OrderStatus.CANCELLED) {
          updateData.cancelledAt = new Date();
        }

        if (dto.status === OrderStatus.DELIVERED) {
          updateData.completedAt = new Date();
        }
      }

      let paymentPaidAt: Date | null | undefined = undefined;

      if (dto.paymentStatus !== undefined) {
        updateData.paymentStatus = dto.paymentStatus;

        if (dto.paymentStatus === PaymentStatus.PAID) {
          const now = new Date();
          updateData.paidAt = now;
          updateData.inventoryStatus = OrderInventoryStatus.COMMITTED;
          updateData.inventoryCommittedAt = now;
          paymentPaidAt = now;
        }

        if (
          dto.paymentStatus === PaymentStatus.PENDING ||
          dto.paymentStatus === PaymentStatus.FAILED ||
          dto.paymentStatus === PaymentStatus.REFUNDED
        ) {
          updateData.paidAt = null;
          paymentPaidAt = null;
        }
      }

      if (dto.fulfillmentStatus !== undefined) {
        updateData.fulfillmentStatus = dto.fulfillmentStatus;
      }

      const shouldReleaseReservedInventory =
        dto.status === OrderStatus.CANCELLED &&
        existingOrder.inventoryStatus === OrderInventoryStatus.RESERVED;

      if (shouldReleaseReservedInventory) {
        const releaseMarker = await tx.order.updateMany({
          where: {
            id,
            inventoryStatus: OrderInventoryStatus.RESERVED,
          },
          data: {
            ...updateData,
            inventoryStatus: OrderInventoryStatus.RELEASED,
            inventoryReleasedAt: new Date(),
            cancelledAt: updateData.cancelledAt ?? new Date(),
          },
        });

        if (releaseMarker.count > 0) {
          await this.checkoutInventoryService.releaseOrderStock(tx, id);
        }
      } else {
        await tx.order.update({
          where: {
            id,
          },
          data: updateData,
        });
      }

      if (dto.paymentStatus !== undefined) {
        await tx.payment.updateMany({
          where: {
            orderId: id,
          },
          data: {
            status: dto.paymentStatus,
            paidAt: paymentPaidAt,
          },
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

    return this.toOrderResponse(order);
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
