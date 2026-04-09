import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CreateOrderRequest, CheckoutSessionResponse } from '@ecomsaas/contracts';
import { CreateOrderRequestSchema } from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CheckoutService } from './checkout.service';

@ApiTags('checkout')
@Controller('api/v1')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('stores/:storeId/checkout')
  @Roles('Customer', 'Buyer', 'Admin')
  @ApiOperation({ summary: 'Create a checkout session with Stripe payment' })
  @ApiCreatedResponse({ description: 'Checkout session created, returns client secret' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Store or product not found' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async createCheckoutSession(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body(new ZodValidationPipe(CreateOrderRequestSchema)) body: CreateOrderRequest,
    @CurrentUser() user: AuthUser
  ): Promise<CheckoutSessionResponse> {
    return this.checkoutService.createCheckoutSession(body, storeId, user);
  }
}
