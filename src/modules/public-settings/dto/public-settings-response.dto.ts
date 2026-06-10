import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PublicStoreResponseDto {
  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: String, nullable: true })
  logoUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  faviconUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  supportPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  supportWhatsapp: string | null;
}

export class PublicHomepageResponseDto {
  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({ type: String })
  description: string;
}

export class PublicAnnouncementResponseDto {
  @ApiProperty({ type: Boolean })
  enabled: boolean;

  @ApiProperty({ type: String, nullable: true })
  text: string | null;
}

export class PublicFeaturesResponseDto {
  @ApiProperty({ type: Boolean })
  guestCheckout: boolean;

  @ApiProperty({ type: Boolean })
  accountRegistration: boolean;

  @ApiProperty({ type: Boolean })
  reviews: boolean;

  @ApiProperty({ type: Boolean })
  wishlist: boolean;

  @ApiProperty({ type: Boolean })
  coupons: boolean;

  @ApiProperty({ type: Boolean })
  chat: boolean;
}

export class PublicCommerceResponseDto {
  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: Number })
  taxRate: number;

  @ApiProperty({ type: Number })
  defaultShippingCost: number;

  @ApiProperty({ type: Number, nullable: true })
  freeShippingOver: number | null;
}

export class PublicCountryResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  iso2: string;

  @ApiProperty({ type: String })
  iso3: string;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  phoneCode: string;

  @ApiProperty({ type: Boolean })
  allowCheckout: boolean;

  @ApiProperty({ type: Boolean })
  allowShipping: boolean;

  @ApiProperty({ type: Boolean })
  isDefault: boolean;
}

export class PublicPaymentMethodResponseDto {
  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ type: String })
  label: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Boolean })
  isOnline: boolean;

  @ApiProperty({ type: Number, nullable: true })
  minAmount: number | null;

  @ApiProperty({ type: Number, nullable: true })
  maxAmount: number | null;
}

export class PublicSocialResponseDto {
  @ApiProperty({ type: String, nullable: true })
  instagramUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  facebookUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  tiktokUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  youtubeUrl: string | null;
}

export class PublicSettingsResponseDto {
  @ApiProperty({ type: PublicStoreResponseDto })
  store: PublicStoreResponseDto;

  @ApiProperty({ type: PublicHomepageResponseDto })
  homepage: PublicHomepageResponseDto;

  @ApiProperty({ type: PublicAnnouncementResponseDto })
  announcement: PublicAnnouncementResponseDto;

  @ApiProperty({ type: PublicFeaturesResponseDto })
  features: PublicFeaturesResponseDto;

  @ApiProperty({ type: PublicCommerceResponseDto })
  commerce: PublicCommerceResponseDto;

  @ApiProperty({ type: [PublicCountryResponseDto] })
  countries: PublicCountryResponseDto[];

  @ApiProperty({ type: [PublicPaymentMethodResponseDto] })
  paymentMethods: PublicPaymentMethodResponseDto[];

  @ApiProperty({ type: PublicSocialResponseDto })
  social: PublicSocialResponseDto;

  @ApiProperty({ type: Boolean })
  maintenanceMode: boolean;
}
