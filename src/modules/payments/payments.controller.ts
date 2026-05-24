import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CreateStripePaymentIntentDto } from './dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

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

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
  })
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    this.logger.log('Stripe webhook received');

    if (!signature) {
      this.logger.warn('Stripe webhook missing signature');

      return {
        received: false,
        message: 'Missing stripe-signature header',
      };
    }

    if (!request.rawBody) {
      this.logger.warn('Stripe webhook missing raw body');

      return {
        received: false,
        message: 'Missing raw body',
      };
    }

    const result = await this.paymentsService.handleStripeWebhook({
      rawBody: request.rawBody,
      signature,
    });

    this.logger.log(`Stripe webhook handled: ${JSON.stringify(result)}`);

    return result;
  }
}
