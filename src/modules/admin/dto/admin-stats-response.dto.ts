import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty({
    type: Number,
    example: 12,
    description: 'Orders created today',
  })
  ordersToday: number;

  @ApiProperty({
    type: Number,
    example: 1024.5,
    description: 'Sum of paid orders’ totals for today',
  })
  revenueToday: number;

  @ApiProperty({ type: Number, example: 3 })
  lowStockCount: number;

  @ApiProperty({ type: Number, example: 5 })
  lowStockThreshold: number;
}
