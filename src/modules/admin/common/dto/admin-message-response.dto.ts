import { ApiProperty } from '@nestjs/swagger';

export class AdminMessageResponseDto {
  @ApiProperty({
    type: String,
    example: 'Operation completed successfully',
  })
  message: string;
}
