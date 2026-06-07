import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserResponseDto {
  @ApiProperty({
    example: 'b5a2e7e3-2bc0-4969-9b1f-6d0c4d5f2f11',
  })
  id: string;

  @ApiProperty({
    example: 'admin@zemlo.com',
  })
  email: string;

  @ApiProperty({
    example: 'Faisal',
  })
  firstName: string;

  @ApiProperty({
    example: 'Rehman',
  })
  lastName: string;

  @ApiPropertyOptional({
    example: '+13001234567',
    nullable: true,
  })
  phone: string | null;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/zemlo/avatar.png',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({
    example: '0bbec080-42ba-4559-b0aa-0fa7211575a4',
  })
  sessionId: string;

  @ApiProperty({
    type: [String],
    example: ['products.view', 'orders.view_own'],
  })
  permissions: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthSessionResponseDto {
  @ApiProperty({
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}
