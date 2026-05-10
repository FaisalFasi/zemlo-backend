import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { GuestCheckoutDto, AuthCheckoutDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Guest checkout without login' })
  @ApiResponse({ status: 201, description: 'Guest checkout created' })
  guestCheckout(@Body() dto: GuestCheckoutDto) {
    return this.checkoutService.guestCheckout(dto);
  }

  @Post('auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Authenticated user checkout' })
  @ApiResponse({ status: 201, description: 'Authenticated checkout created' })
  authCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AuthCheckoutDto,
  ) {
    return this.checkoutService.authCheckout(user.id, dto);
  }
}
