import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    type: String,
    example: 'Operation completed successfully',
  })
  message: string;
}
