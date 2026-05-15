import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

import { PaymentSettingsService } from './payment-settings.service';
import { UpdatePaymentMethodSettingDto } from './dto';

@ApiTags('Admin - Payment Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/payment-settings')
export class PaymentSettingsController {
  constructor(
    private readonly paymentSettingsService: PaymentSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payment method settings' })
  findAll() {
    return this.paymentSettingsService.findAll();
  }

  @Get(':method')
  @ApiOperation({ summary: 'Get single payment method setting' })
  @ApiParam({
    name: 'method',
    enum: PaymentMethod,
    example: PaymentMethod.MANUAL,
  })
  findOne(@Param('method') method: PaymentMethod) {
    return this.paymentSettingsService.findOne(method);
  }

  @Patch(':method')
  @ApiOperation({ summary: 'Update payment method setting' })
  @ApiParam({
    name: 'method',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  update(
    @Param('method') method: PaymentMethod,
    @Body() dto: UpdatePaymentMethodSettingDto,
  ) {
    return this.paymentSettingsService.update(method, dto);
  }
}
