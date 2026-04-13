import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  CreateStoreRequest,
  PublicStoreResponse,
  StoreResponse,
  StoreListResponse,
  UpdateStoreRequest,
} from '@ecomsaas/contracts';
import { StoreType } from '@ecomsaas/domain';
import type { SortDirection } from '@ecomsaas/contracts/common';
import { CreateStoreRequestSchema, UpdateStoreRequestSchema } from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseOptionalEnumPipe } from '../common/pipes/parse-optional-enum.pipe';
import { ParseSlugPipe } from './pipes/parse-slug.pipe';
import { StoresService } from './stores.service';

const StoreSortBy = { name: 'name', createdAt: 'createdAt' } as const;
const SortDirectionEnum = { asc: 'asc', desc: 'desc' } as const;

@ApiTags('stores')
@Controller('api/v1/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  // ── Public endpoints ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List/search active stores for marketplace' })
  @ApiOkResponse({ description: 'Paginated list of active store summaries' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by store name' })
  @ApiQuery({ name: 'storeType', required: false, enum: StoreType })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt'] })
  @ApiQuery({ name: 'sortDirection', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @Query('q') q?: string,
    @Query('storeType', new ParseOptionalEnumPipe(StoreType, 'storeType')) storeType?: StoreType,
    @Query('sortBy', new ParseOptionalEnumPipe(StoreSortBy, 'sortBy'))
    sortBy?: 'name' | 'createdAt',
    @Query('sortDirection', new ParseOptionalEnumPipe(SortDirectionEnum, 'sortDirection'))
    sortDirection?: SortDirection,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<StoreListResponse> {
    return this.storesService.listForMarketplace({
      q,
      storeType,
      sortBy,
      sortDirection,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiOkResponse({ description: 'Store found and returned' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<PublicStoreResponse> {
    return this.storesService.getByIdPublic(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get active store by slug' })
  @ApiOkResponse({ description: 'Store found and returned' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  async getBySlug(@Param('slug', ParseSlugPipe) slug: string): Promise<PublicStoreResponse> {
    return this.storesService.getBySlugPublic(slug);
  }

  // ── Vendor/Admin endpoints ──────────────────────────────────────────

  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiCreatedResponse({ description: 'Store created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async create(
    @Body(new ZodValidationPipe(CreateStoreRequestSchema)) body: CreateStoreRequest,
    @CurrentUser() user: AuthUser
  ): Promise<StoreResponse> {
    return this.storesService.createForUser(body, user);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a store' })
  @ApiOkResponse({ description: 'Store updated' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateStoreRequestSchema)) body: UpdateStoreRequest,
    @CurrentUser() user: AuthUser
  ): Promise<StoreResponse> {
    return this.storesService.update({ id, ...body }, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a store' })
  @ApiNoContentResponse({ description: 'Store deleted' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser
  ): Promise<void> {
    return this.storesService.remove(id, user);
  }

  @Get('vendor/:slug')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store by slug for vendor/admin context' })
  @ApiOkResponse({ description: 'Store found and returned for vendor/admin' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Store not found' })
  async getBySlugVendor(
    @Param('slug', ParseSlugPipe) slug: string,
    @CurrentUser() user: AuthUser
  ): Promise<StoreResponse> {
    return this.storesService.getBySlugForVendor(slug, user);
  }
}
