import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentMethodSettingResponseDto {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ enum: PaymentMethod, enumName: 'PaymentMethod' })
  method: PaymentMethod;

  @ApiProperty({ type: String })
  label: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Boolean })
  isEnabled: boolean;

  @ApiProperty({ type: Boolean })
  isOnline: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  minAmount: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  maxAmount: number | null;

  @ApiProperty({ type: Number })
  sortOrder: number;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: unknown | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
