import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthCheckoutDto, CheckoutItemDto, GuestCheckoutDto } from './dto';

import {
  CheckoutLine,
  CreateCheckoutParams,
  NormalizedCheckoutItem,
} from './types/checkout.types';

import { roundMoney } from './helpers/checkout-money.helper';
import { CheckoutSettingsService } from './services/checkout-settings.service';
import { CheckoutPricingService } from './services/checkout-pricing.service';
import { CheckoutInventoryService } from './services/checkout-inventory.service';
import { CheckoutAddressService } from './services/checkout-address.service';
import { CheckoutOrderService } from './services/checkout-order.service';
import { ALLOWED_CHECKOUT_PAYMENT_METHODS } from './helpers/checkout-payment.helper';
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

  async guestCheckout(dto: GuestCheckoutDto) {
    return this.createCheckout({
      dto,
      isGuest: true,
    });
  }

  async authCheckout(userId: string, dto: AuthCheckoutDto) {
    return this.createCheckout({
      dto,
      userId,
      isGuest: false,
    });
  }

  private async createCheckout(params: CreateCheckoutParams) {
    const { dto, userId, isGuest } = params;

    this.validatePaymentMethod(dto.paymentMethod);

    // here tx is a prisma db instance to fetch data from db
    return this.prisma.$transaction(async (tx) => {
      const settings = await tx.platformSettings.findFirst();

      this.settingsService.validateGuestCheckout(isGuest, settings);
      await this.availabilityService.validateShippingCountry(
        tx,
        dto.shippingAddress,
      );

      const normalizedItems = this.normalizeItems(dto.items);

      const lines = await this.buildCheckoutLines(tx, normalizedItems);

      const totals = this.pricingService.calculateTotals({
        lines,
        taxRate: 0,
        shippingCost: 0,
        discount: 0,
      });

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
          currency: 'USD',
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
            name: line.name,
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
        },
        nextStep:
          dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
            ? 'Order is pending confirmation for cash on delivery'
            : 'Order is pending manual payment confirmation',
      };
    });
  }

  private validatePaymentMethod(paymentMethod: PaymentMethod) {
    if (!ALLOWED_CHECKOUT_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new BadRequestException('This payment method is not available yet');
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
    tx: any,
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
            position: 'asc',
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
    product: any,
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
