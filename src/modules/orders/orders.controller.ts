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

import { PERMISSIONS } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GuestOrderLookupDto,
  UpdateAdminOrderShippingDto,
  UpdateAdminOrderStatusDto,
} from './dto';
import { OrdersService } from './orders.service';

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORDERS_VIEW_ALL)
  @ApiOperation({ summary: 'Admin: get all orders' })
  findAllAdminOrders() {
    return this.ordersService.findAllAdminOrders();
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORDERS_VIEW_ALL)
  @ApiOperation({ summary: 'Admin: get order by ID' })
  findAdminOrderById(@Param('id') id: string) {
    return this.ordersService.findAdminOrderById(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Admin: update order status' })
  updateAdminOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateAdminOrderStatus(id, dto, user.id);
  }

  @Patch('admin/orders/:id/shipping')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(PERMISSIONS.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Admin: update order shipping and tracking' })
  updateAdminOrderShipping(
    @Param('id') id: string,
    @Body() dto: UpdateAdminOrderShippingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateAdminOrderShipping(id, dto, user.id);
  }
}
