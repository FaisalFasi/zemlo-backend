import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AdminStatsQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 5,
    minimum: 0,
    description: 'Stock at or below this counts as low-stock',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number = 5;
}
