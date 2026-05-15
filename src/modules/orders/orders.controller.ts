import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';

import { OrdersService } from './orders.service';
import { UpdateAdminOrderStatusDto } from './dto';

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

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Admin: get all orders' })
  findAllAdminOrders() {
    return this.ordersService.findAllAdminOrders();
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
