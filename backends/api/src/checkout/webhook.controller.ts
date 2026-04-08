import { Controller, Post, Req, Headers, HttpCode } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CheckoutService } from './checkout.service';

@Controller('api/v1/webhooks')
@SkipThrottle()
export class WebhookController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: true }> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available. Ensure rawBody middleware is configured.');
    }

    await this.checkoutService.handleWebhookEvent(rawBody, signature);
    return { received: true };
  }
}
