import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { GuestOrderLookupDto, UpdateAdminOrderStatusDto } from './dto';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
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

    return order;
  }

  async findAllAdminOrders() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
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

    return order;
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

    return this.prisma.$transaction(async (tx) => {
      const updateData: {
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        fulfillmentStatus?: FulfillmentStatus;
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

      await tx.order.update({
        where: {
          id,
        },
        data: updateData,
      });

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

    return order;
  }
}
