import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthCheckoutDto, GuestCheckoutDto } from './dto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async guestCheckout(dto: GuestCheckoutDto) {
    return {
      message: 'Guest checkout endpoint working',
      dto,
    };
  }

  async authCheckout(userId: string, dto: AuthCheckoutDto) {
    return {
      message: 'Auth checkout endpoint working',
      userId,
      dto,
    };
  }
}
