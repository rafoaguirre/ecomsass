import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { StoreResponse } from '@ecomsaas/contracts';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { ParseSlugPipe } from './pipes/parse-slug.pipe';
import { StoresService } from './stores.service';

@ApiTags('stores')
@Controller('api/v1/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get active store by slug' })
  @ApiOkResponse({ description: 'Store found and returned' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  async getBySlug(@Param('slug', ParseSlugPipe) slug: string): Promise<StoreResponse> {
    return this.storesService.getBySlugPublic(slug);
  }

  @Get(':slug/vendor')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store by slug for vendor/admin context' })
  @ApiOkResponse({ description: 'Store found and returned for vendor/admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  async getBySlugVendor(@Param('slug', ParseSlugPipe) slug: string): Promise<StoreResponse> {
    return this.storesService.getBySlugForVendor(slug);
  }
}
