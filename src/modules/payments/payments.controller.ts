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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create Stripe PaymentIntent for an existing order',
    description:
      'Authenticated customers must provide their access token. Guest customers must provide the same email used during checkout.',
  })
  @ApiOkResponse({
    type: StripePaymentIntentResponseDto,
    description: 'Stripe PaymentIntent created or retrieved',
  })
  createStripePaymentIntent(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() dto: CreateStripePaymentIntentDto,
  ) {
    return this.paymentsService.createStripePaymentIntent(dto, user?.id);
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
