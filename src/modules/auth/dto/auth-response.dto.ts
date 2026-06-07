import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserResponseDto {
  @ApiProperty({
    type: String,
    example: 'b5a2e7e3-2bc0-4969-9b1f-6d0c4d5f2f11',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'admin@zemlo.com',
  })
  email: string;

  @ApiProperty({
    type: String,
    example: 'Faisal',
  })
  firstName: string;

  @ApiProperty({
    type: String,
    example: 'Rehman',
  })
  lastName: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '+13001234567',
  })
  phone: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'https://res.cloudinary.com/zemlo/avatar.png',
  })
  avatar: string | null;

  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    type: String,
    example: '0bbec080-42ba-4559-b0aa-0fa7211575a4',
  })
  sessionId: string;

  @ApiProperty({
    type: [String],
    example: ['products.view', 'orders.view_own'],
  })
  permissions: string[];

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}

export class AuthSessionResponseDto {
  @ApiProperty({
    type: String,
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    type: () => AuthUserResponseDto,
  })
  user: AuthUserResponseDto;

  @ApiProperty({
    type: String,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    type: () => AuthUserResponseDto,
  })
  user: AuthUserResponseDto;
}
