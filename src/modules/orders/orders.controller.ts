import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

import { OrdersService } from './orders.service';
import {
  UpdateAdminOrderStatusDto,
  GuestOrderLookupDto,
  UpdateAdminOrderShippingDto,
} from './dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('orders/my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user orders' })
  findMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMyOrders(user.id);
  }

  @Get('orders/my-orders/:orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user order by order number' })
  findMyOrderByOrderNumber(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.ordersService.findMyOrderByOrderNumber(user.id, orderNumber);
  }

  @Post('orders/guest/lookup')
  @ApiOperation({ summary: 'Guest: lookup order by order number and email' })
  findGuestOrder(@Body() dto: GuestOrderLookupDto) {
    return this.ordersService.findGuestOrder(dto);
  }

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: get all orders' })
  findAllAdminOrders() {
    return this.ordersService.findAllAdminOrders();
  }

  @Patch('admin/orders/:id/shipping')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: update order shipping and tracking' })
  updateAdminOrderShipping(
    @Param('id') id: string,
    @Body() dto: UpdateAdminOrderShippingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateAdminOrderShipping(id, dto, user.id);
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: get order by ID' })
  findAdminOrderById(@Param('id') id: string) {
    return this.ordersService.findAdminOrderById(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: update order status' })
  updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateAdminOrderStatus(id, dto, user.id);
  }
}
