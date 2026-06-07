import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdatePaymentMethodSettingDto } from './dto';
import { PaymentSettingsService } from './payment-settings.service';

@ApiTags('Admin - Payment Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/payment-settings')
export class PaymentSettingsController {
  constructor(
    private readonly paymentSettingsService: PaymentSettingsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get all payment method settings' })
  findAll() {
    return this.paymentSettingsService.findAll();
  }

  @Get(':method')
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get single payment method setting' })
  @ApiParam({
    name: 'method',
    enum: PaymentMethod,
    example: PaymentMethod.MANUAL,
  })
  findOne(
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
  ) {
    return this.paymentSettingsService.findOne(method);
  }

  @Patch(':method')
  @RequirePermissions(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update payment method setting' })
  @ApiParam({
    name: 'method',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  update(
    @Param('method', new ParseEnumPipe(PaymentMethod)) method: PaymentMethod,
    @Body() dto: UpdatePaymentMethodSettingDto,
  ) {
    return this.paymentSettingsService.update(method, dto);
  }
}
