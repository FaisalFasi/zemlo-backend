import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'x-guest-id',
  required: false,
  description:
    'Required only for guest cart requests. Not required when Authorization bearer token is valid.',
})
@UseGuards(OptionalJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user or guest cart' })
  getCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
  ) {
    return this.cartService.getCart(user?.id, this.getGuestId(request));
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user?.id, this.getGuestId(request), dto);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      user?.id,
      this.getGuestId(request),
      itemId,
      dto,
    );
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ) {
    return this.cartService.removeItem(
      user?.id,
      this.getGuestId(request),
      itemId,
    );
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() request: Request,
  ) {
    return this.cartService.clearCart(user?.id, this.getGuestId(request));
  }

  private getGuestId(request: Request): string | undefined {
    const guestId = request.headers['x-guest-id'];

    if (Array.isArray(guestId)) {
      return guestId[0];
    }

    return guestId;
  }
}
