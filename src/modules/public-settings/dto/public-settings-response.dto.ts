import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PublicStoreResponseDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  email: string | null;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  faviconUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  supportPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  supportWhatsapp: string | null;
}

export class PublicHomepageResponseDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;
}

export class PublicAnnouncementResponseDto {
  @ApiProperty()
  enabled: boolean;

  @ApiPropertyOptional({ nullable: true })
  text: string | null;
}

export class PublicFeaturesResponseDto {
  @ApiProperty()
  guestCheckout: boolean;

  @ApiProperty()
  accountRegistration: boolean;

  @ApiProperty()
  reviews: boolean;

  @ApiProperty()
  wishlist: boolean;

  @ApiProperty()
  coupons: boolean;

  @ApiProperty()
  chat: boolean;
}

export class PublicCommerceResponseDto {
  @ApiProperty()
  currency: string;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  defaultShippingCost: number;

  @ApiPropertyOptional({ nullable: true })
  freeShippingOver: number | null;
}

export class PublicCountryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  iso2: string;

  @ApiProperty()
  iso3: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  phoneCode: string;

  @ApiProperty()
  allowCheckout: boolean;

  @ApiProperty()
  allowShipping: boolean;

  @ApiProperty()
  isDefault: boolean;
}

export class PublicPaymentMethodResponseDto {
  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isOnline: boolean;

  @ApiPropertyOptional({ nullable: true })
  minAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxAmount: number | null;
}

export class PublicSocialResponseDto {
  @ApiPropertyOptional({ nullable: true })
  instagramUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  facebookUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  tiktokUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
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

  @ApiProperty()
  maintenanceMode: boolean;
}
