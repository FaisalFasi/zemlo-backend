import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 'Zemlo' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  storeName?: string;

  @ApiPropertyOptional({ example: 'support@zemlo.com' })
  @IsOptional()
  @IsEmail()
  storeEmail?: string;

  @ApiPropertyOptional({ example: '+13001234567' })
  @IsOptional()
  @IsString()
  @Length(5, 30)
  supportPhone?: string;

  @ApiPropertyOptional({ example: '+13001234567' })
  @IsOptional()
  @IsString()
  @Length(5, 30)
  supportWhatsapp?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  storeLogoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/favicon.ico' })
  @IsOptional()
  @IsUrl()
  storeFaviconUrl?: string;

  @ApiPropertyOptional({ example: 'Zemlo LLC' })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  businessName?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  businessCity?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  businessState?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  businessZipCode?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  businessCountry?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeShippingOver?: number;

  @ApiPropertyOptional({ example: 9.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultShippingCost?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowGuestCheckout?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowAccountRegistration?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableReviews?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableWishlist?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableCoupons?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableChat?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ example: 'Zemlo' })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  homepageTitle?: string;

  @ApiPropertyOptional({ example: 'Premium fashion and lifestyle store' })
  @IsOptional()
  @IsString()
  @Length(2, 1000)
  homepageDescription?: string;

  @ApiPropertyOptional({ example: 'Free shipping this week!' })
  @IsOptional()
  @IsString()
  @Length(2, 300)
  announcementText?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  announcementEnabled?: boolean;

  @ApiPropertyOptional({ example: 'https://instagram.com/zemlo' })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/zemlo' })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiPropertyOptional({ example: 'https://tiktok.com/@zemlo' })
  @IsOptional()
  @IsUrl()
  tiktokUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@zemlo' })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;
}
