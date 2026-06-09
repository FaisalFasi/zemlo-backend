import type { Prisma } from '@prisma/client';
import { PaymentMethod } from '@prisma/client';
import { CheckoutAddressDto, CheckoutItemDto } from '../dto';

export type CheckoutDtoBase = {
  items: CheckoutItemDto[];
  shippingAddress: CheckoutAddressDto;
  billingAddress?: CheckoutAddressDto;
  paymentMethod: PaymentMethod;
  customerNote?: string;
};

export type CheckoutCustomerDetails = CheckoutDtoBase & {
  guestEmail?: string;
  guestPhone?: string;
  guestFirstName?: string;
  guestLastName?: string;
};

export type NormalizedCheckoutItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type CheckoutLine = {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  productSnapshot: Prisma.InputJsonObject;
};

export type CheckoutTotals = {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
};

export type CreateCheckoutParams = {
  dto: CheckoutCustomerDetails;
  userId?: string;
  isGuest: boolean;
};

export type CreateAddressParams = {
  shippingAddress: CheckoutAddressDto;
  billingAddress?: CheckoutAddressDto;
  userId?: string;
  isGuest: boolean;
};

export type CheckoutProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    images: true;
  };
}>;

export type CheckoutPlatformSettings =
  Prisma.PlatformSettingsGetPayload<object> | null;
