import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeName: string;

  @ApiPropertyOptional({ nullable: true })
  storeEmail: string | null;

  @ApiPropertyOptional({ nullable: true })
  storeLogoUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  storeFaviconUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  supportPhone: string | null;

  @ApiPropertyOptional({ nullable: true })
  supportWhatsapp: string | null;

  @ApiProperty()
  homepageTitle: string;

  @ApiProperty()
  homepageDescription: string;

  @ApiProperty()
  announcementEnabled: boolean;

  @ApiPropertyOptional({ nullable: true })
  announcementText: string | null;

  @ApiProperty()
  allowGuestCheckout: boolean;

  @ApiProperty()
  allowAccountRegistration: boolean;

  @ApiProperty()
  requireEmailVerification: boolean;

  @ApiProperty()
  enableReviews: boolean;

  @ApiProperty()
  enableWishlist: boolean;

  @ApiProperty()
  enableCoupons: boolean;

  @ApiProperty()
  enableChat: boolean;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  taxRate: number;

  @ApiProperty()
  defaultShippingCost: number;

  @ApiPropertyOptional({ nullable: true })
  freeShippingOver: number | null;

  @ApiPropertyOptional({ nullable: true })
  instagramUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  facebookUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  tiktokUrl: string | null;

  @ApiPropertyOptional({ nullable: true })
  youtubeUrl: string | null;

  @ApiProperty()
  maintenanceMode: boolean;

  @ApiPropertyOptional({ nullable: true })
  maintenanceMessage: string | null;

  @ApiPropertyOptional({ nullable: true })
  updatedBy: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
