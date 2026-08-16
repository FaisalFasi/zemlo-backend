import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    type: String,
    example:
      'https://res.cloudinary.com/zemlo/image/upload/v1699999999/zemlo/products/abc123.jpg',
  })
  url: string;

  @ApiProperty({ type: String, example: 'zemlo/products/abc123' })
  publicId: string;
}
