import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import {
  CreateStripePaymentIntentDto,
  StripePaymentIntentResponseDto,
  StripeWebhookResponseDto,
} from './dto';
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
  @ApiOkResponse({
    type: StripePaymentIntentResponseDto,
    description: 'Stripe PaymentIntent created or retrieved',
  })
  createStripePaymentIntent(@Body() dto: CreateStripePaymentIntentDto) {
    return this.paymentsService.createStripePaymentIntent(dto);
  }

  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
  })
  @ApiResponse({
    status: 200,
    type: StripeWebhookResponseDto,
    description: 'Stripe webhook event processed',
  })
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    this.logger.log('Stripe webhook received');

    if (!signature) {
      return {
        received: false,
        message: 'Missing stripe-signature header',
      };
    }

    if (!request.rawBody) {
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
