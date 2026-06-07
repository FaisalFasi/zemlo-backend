import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentMethodSettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  isOnline: boolean;

  @ApiPropertyOptional({ nullable: true })
  minAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxAmount: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: unknown | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
