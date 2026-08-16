import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

import { PERMISSIONS } from '../../../common/constants/permissions';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import {
  PaymentMethodSettingResponseDto,
  UpdatePaymentMethodSettingDto,
} from './dto';
import { PaymentSettingsService } from './payment-settings.service';

@ApiTags('Admin - Payment Settings')
@ApiBearerAuth('access-token')
@Controller('admin/payment-settings')
export class PaymentSettingsController {
  constructor(
    private readonly paymentSettingsService: PaymentSettingsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get all payment method settings' })
  @ApiOkResponse({ type: [PaymentMethodSettingResponseDto] })
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
  @ApiOkResponse({ type: PaymentMethodSettingResponseDto })
  findOne(
    @Param('method', new ParseEnumPipe(PaymentMethod))
    method: PaymentMethod,
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
  @ApiOkResponse({ type: PaymentMethodSettingResponseDto })
  update(
    @Param('method', new ParseEnumPipe(PaymentMethod))
    method: PaymentMethod,
    @Body() dto: UpdatePaymentMethodSettingDto,
  ) {
    return this.paymentSettingsService.update(method, dto);
  }
}
