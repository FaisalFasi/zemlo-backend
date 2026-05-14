import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckoutAddressDto } from '../dto';

@Injectable()
export class CheckoutAvailabilityService {
  async validateShippingCountry(tx: any, shippingAddress: CheckoutAddressDto) {
    const countryCode = shippingAddress.country?.trim().toUpperCase();

    if (!countryCode) {
      throw new BadRequestException('Shipping country is required');
    }

    const country = await tx.countrySetting.findUnique({
      where: {
        iso2: countryCode,
      },
    });

    if (!country) {
      throw new BadRequestException('We are not available in this country yet');
    }

    if (!country.isActive) {
      throw new BadRequestException('This country is currently disabled');
    }

    if (!country.allowWebsiteAccess) {
      throw new BadRequestException(
        'Website access is not available in this country',
      );
    }

    if (!country.allowCheckout) {
      throw new BadRequestException(
        'Checkout is not available in this country',
      );
    }

    if (!country.allowShipping) {
      throw new BadRequestException(
        'Shipping is not available in this country',
      );
    }

    return country;
  }
}
