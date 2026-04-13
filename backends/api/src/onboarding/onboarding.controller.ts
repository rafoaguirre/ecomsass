import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CreateStoreRequest, StoreResponse } from '@ecomsaas/contracts';
import { CreateStoreRequestSchema } from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('store')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Onboard vendor: create vendor profile (if needed) and store' })
  @ApiCreatedResponse({ description: 'Store created and onboarding completed' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async onboardStore(
    @Body(new ZodValidationPipe(CreateStoreRequestSchema)) body: CreateStoreRequest,
    @CurrentUser() user: AuthUser
  ): Promise<StoreResponse> {
    return this.onboardingService.onboardStore(body, user);
  }
}
