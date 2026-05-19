import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';

const MAX_CART_ITEM_QUANTITY = 999;

const cartProductSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  trackInventory: true,
  allowBackorder: true,
  hasVariants: true,
  status: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },
  brand: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isActive: true,
    },
  },
  images: {
    orderBy: [
      {
        isDefault: Prisma.SortOrder.desc,
      },
      {
        position: Prisma.SortOrder.asc,
      },
    ],
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
      isDefault: true,
    },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

const cartVariantSelect = {
  id: true,
  name: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  trackInventory: true,
  allowBackorder: true,
  image: true,
  options: true,
  isActive: true,
} satisfies Prisma.ProductVariantSelect;

const cartInclude = {
  items: {
    orderBy: {
      addedAt: Prisma.SortOrder.desc,
    },
    include: {
      product: {
        select: cartProductSelect,
      },
      variant: {
        select: cartVariantSelect,
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartOwner =
  | {
      userId: string;
      guestId?: never;
    }
  | {
      userId?: never;
      guestId: string;
    };

type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

type CartProduct = Prisma.ProductGetPayload<{
  select: typeof cartProductSelect;
}>;

type CartVariant = Prisma.ProductVariantGetPayload<{
  select: typeof cartVariantSelect;
}>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId?: string, guestId?: string) {
    const cart = await this.getOrCreateCart(userId, guestId);

    return this.toCartResponse(cart);
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    dto: AddCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
      },
      select: cartProductSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    this.assertProductCanBeAdded(product);

    if (product.hasVariants && !dto.variantId) {
      throw new BadRequestException('Please select a product variant');
    }

    const variant = dto.variantId
      ? await this.prisma.productVariant.findFirst({
          where: {
            id: dto.variantId,
            productId: dto.productId,
          },
          select: cartVariantSelect,
        })
      : null;

    if (dto.variantId && !variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant) {
      this.assertVariantCanBeAdded(variant);
    }

    const variantKey = dto.variantId ?? 'default';

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantKey: {
          cartId: cart.id,
          productId: dto.productId,
          variantKey,
        },
      },
    });

    const requestedQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    this.assertMaxCartQuantity(requestedQuantity);

    this.assertStockAvailable({
      itemName: variant ? `${product.name} - ${variant.name}` : product.name,
      stock: variant?.stock ?? product.stock,
      trackInventory: variant?.trackInventory ?? product.trackInventory,
      allowBackorder: variant?.allowBackorder ?? product.allowBackorder,
      requestedQuantity,
    });

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId_variantKey: {
          cartId: cart.id,
          productId: dto.productId,
          variantKey,
        },
      },
      update: {
        quantity: {
          increment: dto.quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
        variantKey,
        quantity: dto.quantity,
      },
    });

    const updatedCart = await this.findCartById(cart.id);

    return this.toCartResponse(updatedCart);
  }

  async updateItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: {
          select: cartProductSelect,
        },
        variant: {
          select: cartVariantSelect,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    this.assertProductCanBeAdded(item.product);

    if (item.product.hasVariants && !item.variant) {
      throw new BadRequestException('Please select a product variant');
    }

    if (item.variant) {
      this.assertVariantCanBeAdded(item.variant);
    }

    this.assertMaxCartQuantity(dto.quantity);

    this.assertStockAvailable({
      itemName: item.variant
        ? `${item.product.name} - ${item.variant.name}`
        : item.product.name,
      stock: item.variant?.stock ?? item.product.stock,
      trackInventory:
        item.variant?.trackInventory ?? item.product.trackInventory,
      allowBackorder:
        item.variant?.allowBackorder ?? item.product.allowBackorder,
      requestedQuantity: dto.quantity,
    });

    await this.prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity: dto.quantity,
      },
    });

    const updatedCart = await this.findCartById(cart.id);

    return this.toCartResponse(updatedCart);
  }

  async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    const updatedCart = await this.findCartById(cart.id);

    return this.toCartResponse(updatedCart);
  }

  async clearCart(userId?: string, guestId?: string) {
    const cart = await this.getOrCreateCart(userId, guestId);

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    const updatedCart = await this.findCartById(cart.id);

    return this.toCartResponse(updatedCart);
  }

  private async getOrCreateCart(userId?: string, guestId?: string) {
    const owner = this.resolveCartOwner(userId, guestId);

    if (owner.userId) {
      return this.prisma.cart.upsert({
        where: {
          userId: owner.userId,
        },
        update: {},
        create: {
          userId: owner.userId,
          guestId: null,
        },
        include: cartInclude,
      });
    }

    return this.prisma.cart.upsert({
      where: {
        guestId: owner.guestId,
      },
      update: {},
      create: {
        userId: null,
        guestId: owner.guestId,
      },
      include: cartInclude,
    });
  }

  private async findCartById(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        id: cartId,
      },
      include: cartInclude,
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }

  private resolveCartOwner(userId?: string, guestId?: string): CartOwner {
    const normalizedUserId = userId?.trim();

    if (normalizedUserId) {
      return {
        userId: normalizedUserId,
      };
    }

    const normalizedGuestId = guestId?.trim();

    if (!normalizedGuestId) {
      throw new BadRequestException(
        'x-guest-id header is required for guest cart requests',
      );
    }

    if (normalizedGuestId.length > 150) {
      throw new BadRequestException('x-guest-id header is too long');
    }

    return {
      guestId: normalizedGuestId,
    };
  }

  private assertProductCanBeAdded(product: CartProduct) {
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Product is not active');
    }

    if (!product.category.isActive) {
      throw new BadRequestException('Product category is not active');
    }

    if (product.brand && !product.brand.isActive) {
      throw new BadRequestException('Product brand is not active');
    }
  }

  private assertVariantCanBeAdded(variant: CartVariant) {
    if (!variant.isActive) {
      throw new BadRequestException('Product variant is not active');
    }
  }

  private assertMaxCartQuantity(quantity: number) {
    if (quantity > MAX_CART_ITEM_QUANTITY) {
      throw new BadRequestException(
        `Maximum quantity per cart item is ${MAX_CART_ITEM_QUANTITY}`,
      );
    }
  }

  private assertStockAvailable(params: {
    itemName: string;
    stock: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    requestedQuantity: number;
  }) {
    if (!params.trackInventory || params.allowBackorder) {
      return;
    }

    if (params.requestedQuantity > params.stock) {
      throw new BadRequestException(`${params.itemName} is out of stock`);
    }
  }

  private toCartResponse(cart: CartWithItems) {
    const items = cart.items.map((item) => {
      const unitPrice = this.getUnitPrice(item.product, item.variant);
      const lineTotal = this.roundMoney(unitPrice * item.quantity);

      return {
        id: item.id,
        quantity: item.quantity,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        variantKey: item.variantKey,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
        unitPrice,
        lineTotal,
        product: this.toPublicProduct(item.product),
        variant: this.toPublicVariant(item.variant),
      };
    });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.roundMoney(
      items.reduce((sum, item) => sum + item.lineTotal, 0),
    );

    return {
      id: cart.id,
      userId: cart.userId,
      guestId: cart.guestId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items,
      totalItems: items.length,
      totalQuantity,
      subtotal,
    };
  }

  private toPublicProduct(product: CartProduct) {
    const { status, category, brand, ...safeProduct } = product;

    return {
      ...safeProduct,
      price: this.toNumber(product.price),
      compareAtPrice: this.toNullableNumber(product.compareAtPrice),
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      brand: brand
        ? {
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            logo: brand.logo,
          }
        : null,
    };
  }

  private toPublicVariant(variant: CartVariant | null) {
    if (!variant) {
      return null;
    }

    const { isActive, ...safeVariant } = variant;

    return {
      ...safeVariant,
      price: this.toNullableNumber(variant.price),
      compareAtPrice: this.toNullableNumber(variant.compareAtPrice),
    };
  }

  private getUnitPrice(product: CartProduct, variant: CartVariant | null) {
    return this.toNumber(variant?.price ?? product.price);
  }

  private toNumber(value: Prisma.Decimal | number | string) {
    return Number(value);
  }

  private toNullableNumber(
    value: Prisma.Decimal | number | string | null | undefined,
  ) {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
