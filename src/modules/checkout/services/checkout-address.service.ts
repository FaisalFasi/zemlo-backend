import { Injectable } from '@nestjs/common';
import { AddressType, Prisma } from '@prisma/client';
import type { PrismaTransactionClient } from '../../../common/types/prisma-transaction.type';
import { CheckoutAddressDto } from '../dto';
import { CreateAddressParams } from '../types/checkout.types';

@Injectable()
export class CheckoutAddressService {
  async createCheckoutAddresses(
    tx: PrismaTransactionClient,
    params: CreateAddressParams,
  ) {
    const { shippingAddress, billingAddress, userId, isGuest } = params;

    if (!billingAddress) {
      const address = await tx.address.create({
        data: this.buildAddressData({
          address: shippingAddress,
          userId,
          isGuest,
          type: AddressType.BOTH,
        }),
      });

      return {
        shippingAddressId: address.id,
        billingAddressId: address.id,
      };
    }

    const shipping = await tx.address.create({
      data: this.buildAddressData({
        address: shippingAddress,
        userId,
        isGuest,
        type: AddressType.SHIPPING,
      }),
    });

    const billing = await tx.address.create({
      data: this.buildAddressData({
        address: billingAddress,
        userId,
        isGuest,
        type: AddressType.BILLING,
      }),
    });

    return {
      shippingAddressId: shipping.id,
      billingAddressId: billing.id,
    };
  }

  private buildAddressData(params: {
    address: CheckoutAddressDto;
    userId?: string;
    isGuest: boolean;
    type: AddressType;
  }): Prisma.AddressUncheckedCreateInput {
    const { address, userId, isGuest, type } = params;

    return {
      firstName: address.firstName.trim(),
      lastName: address.lastName.trim(),
      company: address.company?.trim() || null,
      phone: address.phone.trim(),
      street: address.street.trim(),
      apartment: address.apartment?.trim() || null,
      city: address.city.trim(),
      state: address.state.trim(),
      zipCode: address.zipCode.trim(),
      country: address.country?.trim() || 'US',
      type,
      isGuestAddress: isGuest,
      userId: userId ?? null,
    };
  }
}
