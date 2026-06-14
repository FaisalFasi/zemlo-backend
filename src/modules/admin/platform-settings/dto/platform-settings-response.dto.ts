import { ApiProperty } from '@nestjs/swagger';

export class PlatformSettingsResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  storeName: string;

  @ApiProperty({ type: String, nullable: true })
  storeEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  storeLogoUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  storeFaviconUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  supportPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  supportWhatsapp: string | null;

  @ApiProperty({ type: String })
  homepageTitle: string;

  @ApiProperty({ type: String })
  homepageDescription: string;

  @ApiProperty({ type: Boolean })
  announcementEnabled: boolean;

  @ApiProperty({ type: String, nullable: true })
  announcementText: string | null;

  @ApiProperty({ type: Boolean })
  allowGuestCheckout: boolean;

  @ApiProperty({ type: Boolean })
  allowAccountRegistration: boolean;

  @ApiProperty({ type: Boolean })
  requireEmailVerification: boolean;

  @ApiProperty({ type: Boolean })
  enableReviews: boolean;

  @ApiProperty({ type: Boolean })
  enableWishlist: boolean;

  @ApiProperty({ type: Boolean })
  enableCoupons: boolean;

  @ApiProperty({ type: Boolean })
  enableChat: boolean;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: Number })
  taxRate: number;

  @ApiProperty({ type: Number })
  defaultShippingCost: number;

  @ApiProperty({ type: Number, nullable: true })
  freeShippingOver: number | null;

  @ApiProperty({ type: String, nullable: true })
  instagramUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  facebookUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  tiktokUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  youtubeUrl: string | null;

  @ApiProperty({ type: Boolean })
  maintenanceMode: boolean;

  @ApiProperty({ type: String, nullable: true })
  maintenanceMessage: string | null;

  @ApiProperty({ type: String, nullable: true })
  updatedBy: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
