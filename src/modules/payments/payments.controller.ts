import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateStripePaymentIntentDto } from './dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe/create-intent')
  @ApiOperation({
    summary: 'Create Stripe PaymentIntent for an existing order',
  })
  @ApiResponse({
    status: 201,
    description: 'Stripe PaymentIntent created',
  })
  createStripePaymentIntent(@Body() dto: CreateStripePaymentIntentDto) {
    return this.paymentsService.createStripePaymentIntent(dto);
  }
}
