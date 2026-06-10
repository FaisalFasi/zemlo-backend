import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma, ProductStatus } from '@prisma/client';

import type { PrismaTransactionClient } from '../../common/types/prisma-transaction.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthCheckoutDto,
  CheckoutItemDto,
  CheckoutResponseDto,
  FromCartCheckoutDto,
  GuestCheckoutDto,
} from './dto';

import {
  CheckoutLine,
  CheckoutProductWithRelations,
  CreateCheckoutParams,
  NormalizedCheckoutItem,
} from './types/checkout.types';

import { roundMoney } from './helpers/checkout-money.helper';
import { CheckoutSettingsService } from './services/checkout-settings.service';
import { CheckoutPricingService } from './services/checkout-pricing.service';
import { CheckoutInventoryService } from './services/checkout-inventory.service';
import { CheckoutAddressService } from './services/checkout-address.service';
import { CheckoutOrderService } from './services/checkout-order.service';
import { CheckoutAvailabilityService } from './services/checkout.availability.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: CheckoutSettingsService,
    private readonly pricingService: CheckoutPricingService,
    private readonly inventoryService: CheckoutInventoryService,
    private readonly addressService: CheckoutAddressService,
    private readonly orderService: CheckoutOrderService,
    private readonly availabilityService: CheckoutAvailabilityService,
  ) {}

  async guestCheckout(dto: GuestCheckoutDto): Promise<CheckoutResponseDto> {
    return this.createCheckout({
      dto,
      isGuest: true,
    });
  }

  async authCheckout(
    userId: string,
    dto: AuthCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.createCheckout({
      dto,
      userId,
      isGuest: false,
    });
  }

  async checkoutFromCart(
    userId: string | undefined,
    guestId: string | undefined,
    dto: FromCartCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    const normalizedUserId = userId?.trim() || undefined;
    const normalizedGuestId = guestId?.trim() || undefined;
    const isGuest = !normalizedUserId;

    if (isGuest && !normalizedGuestId) {
      throw new BadRequestException(
        'x-guest-id header is required for guest checkout',
      );
    }

    this.validateFromCartGuestDetails(isGuest, dto);

    return this.prisma.$transaction(async (tx) => {
      const cart = normalizedUserId
        ? await tx.cart.findUnique({
            where: {
              userId: normalizedUserId,
            },
            include: {
              items: true,
            },
          })
        : await tx.cart.findUnique({
            where: {
              guestId: normalizedGuestId,
            },
            include: {
              items: true,
            },
          });

      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      if (cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const checkoutDto = {
        ...dto,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        guestFirstName: dto.guestFirstName,
        guestLastName: dto.guestLastName,
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: item.quantity,
        })),
      };

      const result = await this.createCheckoutWithTransaction(tx, {
        dto: checkoutDto,
        userId: normalizedUserId,
        isGuest,
      });

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return {
        ...result,
        message: isGuest
          ? 'Guest checkout from cart created successfully'
          : 'Checkout from cart created successfully',
      };
    });
  }

  private async createCheckout(
    params: CreateCheckoutParams,
  ): Promise<CheckoutResponseDto> {
    return this.prisma.$transaction((tx) =>
      this.createCheckoutWithTransaction(tx, params),
    );
  }

  private async createCheckoutWithTransaction(
    tx: PrismaTransactionClient,
    params: CreateCheckoutParams,
  ): Promise<CheckoutResponseDto> {
    const { dto, userId, isGuest } = params;

    const settings = await tx.platformSettings.findFirst();

    this.settingsService.validateGuestCheckout(isGuest, settings);

    await this.availabilityService.validateShippingCountry(
      tx,
      dto.shippingAddress,
    );

    const normalizedItems = this.normalizeItems(dto.items);

    const lines = await this.buildCheckoutLines(tx, normalizedItems);

    const subtotal = roundMoney(
      lines.reduce((sum, line) => sum + line.totalPrice, 0),
    );

    const freeShippingOver = this.settingsService.getFreeShippingOver(settings);

    const shippingCost =
      freeShippingOver !== null && subtotal >= freeShippingOver
        ? 0
        : this.settingsService.getDefaultShippingCost(settings);

    const totals = this.pricingService.calculateTotals({
      lines,
      taxRate: this.settingsService.getTaxRate(settings),
      shippingCost,
      discount: 0,
    });

    await this.settingsService.validatePaymentMethod(
      tx,
      dto.paymentMethod,
      totals.total,
    );

    const { shippingAddressId, billingAddressId } =
      await this.addressService.createCheckoutAddresses(tx, {
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        userId,
        isGuest,
      });

    for (const line of lines) {
      await this.inventoryService.decreaseStock(tx, line);
    }

    const { order, payment } =
      await this.orderService.createOrderWithItemsAndPayment(tx, {
        userId,
        isGuest,
        dto,
        lines,
        totals,
        shippingAddressId,
        billingAddressId,
        currency: this.settingsService.getCurrency(settings),
      });

    return {
      message: isGuest
        ? 'Guest checkout created successfully'
        : 'Checkout created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId ?? null,
          productName: line.name,
          variantName: line.variantName ?? null,
          sku: line.sku ?? null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
        })),
      },
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        amount: totals.total,
        currency: payment.currency,
        paymentIntentId: payment.paymentIntentId ?? null,
        clientSecret: null,
      },
      nextStep:
        dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? 'Order is pending confirmation for cash on delivery'
          : 'Order is pending manual payment confirmation',
    };
  }

  private validateFromCartGuestDetails(
    isGuest: boolean,
    dto: FromCartCheckoutDto,
  ) {
    if (!isGuest) {
      return;
    }

    if (!dto.guestEmail?.trim()) {
      throw new BadRequestException('Guest email is required');
    }

    if (!dto.guestPhone?.trim()) {
      throw new BadRequestException('Guest phone is required');
    }

    if (!dto.guestFirstName?.trim()) {
      throw new BadRequestException('Guest first name is required');
    }

    if (!dto.guestLastName?.trim()) {
      throw new BadRequestException('Guest last name is required');
    }
  }

  private normalizeItems(items: CheckoutItemDto[]): NormalizedCheckoutItem[] {
    const map = new Map<string, NormalizedCheckoutItem>();

    for (const item of items) {
      const key = `${item.productId}:${item.variantId ?? 'default'}`;

      const existingItem = map.get(key);

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        map.set(key, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }

    return [...map.values()];
  }

  private async buildCheckoutLines(
    tx: PrismaTransactionClient,
    items: NormalizedCheckoutItem[],
  ): Promise<CheckoutLine[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        variants: true,
        images: {
          orderBy: {
            position: Prisma.SortOrder.asc,
          },
          take: 1,
        },
      },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    return items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      return this.buildCheckoutLine(item, product);
    });
  }

  private buildCheckoutLine(
    item: NormalizedCheckoutItem,
    product: CheckoutProductWithRelations,
  ): CheckoutLine {
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(`${product.name} is not available`);
    }

    const variant = item.variantId
      ? product.variants.find(
          (productVariant) => productVariant.id === item.variantId,
        )
      : null;

    if (item.variantId && !variant) {
      throw new BadRequestException(
        `Variant not found for product: ${product.name}`,
      );
    }

    if (product.hasVariants && !item.variantId) {
      throw new BadRequestException(
        `${product.name} requires a variant selection`,
      );
    }

    if (variant && !variant.isActive) {
      throw new BadRequestException(
        `${product.name} selected variant is not available`,
      );
    }

    const unitPrice = Number(variant?.price ?? product.price);
    const totalPrice = roundMoney(unitPrice * item.quantity);

    const trackInventory = variant
      ? variant.trackInventory
      : product.trackInventory;

    const allowBackorder = variant
      ? variant.allowBackorder
      : product.allowBackorder;

    const availableStock = variant ? variant.stock : product.stock;

    if (trackInventory && !allowBackorder && availableStock < item.quantity) {
      throw new BadRequestException(
        `${product.name} does not have enough stock`,
      );
    }

    const image = variant?.image ?? product.images?.[0]?.url ?? null;

    return {
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? product.sku ?? null,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      trackInventory,
      allowBackorder,
      productSnapshot: {
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        slug: product.slug,
        sku: variant?.sku ?? product.sku ?? null,
        variantName: variant?.name ?? null,
        image,
        unitPrice,
      },
    };
  }
}
