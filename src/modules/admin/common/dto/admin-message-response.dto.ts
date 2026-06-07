import { ApiProperty } from '@nestjs/swagger';

export class AdminMessageResponseDto {
  @ApiProperty({
    example: 'Operation completed successfully',
  })
  message: string;
}
