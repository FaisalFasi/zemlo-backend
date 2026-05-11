import { PaymentMethod } from '@prisma/client';
import { CheckoutAddressDto, CheckoutItemDto } from '../dto';

export type CheckoutDtoBase = {
  items: CheckoutItemDto[];
  shippingAddress: CheckoutAddressDto;
  billingAddress?: CheckoutAddressDto;
  paymentMethod: PaymentMethod;
  customerNote?: string;
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
  productSnapshot: Record<string, unknown>;
};

export type CheckoutTotals = {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
};

export type CreateCheckoutParams = {
  dto: CheckoutDtoBase;
  userId?: string;
  isGuest: boolean;
};

export type CreateAddressParams = {
  shippingAddress: CheckoutAddressDto;
  billingAddress?: CheckoutAddressDto;
  userId?: string;
  isGuest: boolean;
};
