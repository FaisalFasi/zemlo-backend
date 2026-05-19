import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class GuestOrderLookupDto {
  @ApiProperty({
    example: 'ZEMLO-2026-0446DF68',
  })
  @IsString()
  @Length(5, 50)
  orderNumber: string;

  @ApiProperty({
    example: 'guest@test.com',
  })
  @IsEmail()
  email: string;
}
