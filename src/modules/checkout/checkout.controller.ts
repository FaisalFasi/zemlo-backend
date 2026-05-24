import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { AuthCheckoutDto, FromCartCheckoutDto, GuestCheckoutDto } from './dto';

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

  @Post('from-cart')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiHeader({
    name: 'x-guest-id',
    required: false,
    description:
      'Required only for guest checkout from cart. Not required when Authorization bearer token is valid.',
  })
  @ApiOperation({ summary: 'Create checkout order from current cart' })
  @ApiResponse({ status: 201, description: 'Order created from cart' })
  checkoutFromCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
    @Body() dto: FromCartCheckoutDto,
  ) {
    return this.checkoutService.checkoutFromCart(
      user?.id,
      this.getGuestId(request),
      dto,
    );
  }

  private getGuestId(request: Request): string | undefined {
    const guestId = request.headers['x-guest-id'];

    if (Array.isArray(guestId)) {
      return guestId[0];
    }

    return guestId;
  }
}
