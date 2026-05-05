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
  CreateProductRequest,
  UpdateProductRequest,
  ProductResponse,
  ProductListResponse,
  ProductSearchResponse,
} from '@ecomsaas/contracts';
import { ProductAvailability } from '@ecomsaas/domain';
import type { SortDirection } from '@ecomsaas/contracts/common';
import {
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  PresignedUploadRequestSchema,
} from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseOptionalEnumPipe } from '../common/pipes/parse-optional-enum.pipe';
import { ProductsService } from './products.service';

const ProductSortBy = { name: 'name', price: 'price', createdAt: 'createdAt' } as const;
const SortDirectionEnum = { asc: 'asc', desc: 'desc' } as const;
const ProductAvailabilityValues = Object.values(ProductAvailability);

@ApiTags('products')
@Controller('api/v1')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Search/list active products across all stores' })
  @ApiOkResponse({ description: 'Paginated list of product summaries' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by product name' })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({
    name: 'availability',
    required: false,
    type: String,
    schema: { type: 'string', enum: ProductAvailabilityValues },
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt'] })
  @ApiQuery({ name: 'sortDirection', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') q?: string,
    @Query('storeId') storeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('availability', new ParseOptionalEnumPipe(ProductAvailability, 'availability'))
    availability?: ProductAvailability,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy', new ParseOptionalEnumPipe(ProductSortBy, 'sortBy'))
    sortBy?: 'name' | 'price' | 'createdAt',
    @Query('sortDirection', new ParseOptionalEnumPipe(SortDirectionEnum, 'sortDirection'))
    sortDirection?: SortDirection,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<ProductSearchResponse> {
    return this.productsService.search({
      q,
      storeId,
      categoryId,
      availability,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      sortBy,
      sortDirection,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ description: 'Product found and returned' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponse> {
    return this.productsService.getById(id);
  }

  @Get('stores/:storeId/products')
  @ApiOperation({ summary: 'List products for a store' })
  @ApiOkResponse({ description: 'List of products' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  async listByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string
  ): Promise<ProductListResponse> {
    return this.productsService.listByStore(storeId, {
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      categoryId,
    });
  }

  // ── Vendor/Admin endpoints ────────────────────────────────────────────────

  @Post('products/images/presigned-url')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL for direct product image upload' })
  @ApiCreatedResponse({ description: 'Presigned upload URL generated' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @HttpCode(HttpStatus.OK)
  async getPresignedUploadUrl(
    @Body(new ZodValidationPipe(PresignedUploadRequestSchema))
    body: {
      contentType: string;
      filename: string;
    }
  ): Promise<{ key: string; uploadUrl: string }> {
    return this.productsService.getPresignedUploadUrl(body.contentType, body.filename);
  }

  @Post('products')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ description: 'Product created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Slug already in use' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role or not store owner' })
  async create(
    @Body(new ZodValidationPipe(CreateProductRequestSchema)) body: CreateProductRequest,
    @CurrentUser() user: AuthUser
  ): Promise<ProductResponse> {
    return this.productsService.create(body, user);
  }

  @Put('products/:id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ description: 'Product updated' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role or not product owner' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateProductRequestSchema)) body: UpdateProductRequest,
    @CurrentUser() user: AuthUser
  ): Promise<ProductResponse> {
    return this.productsService.update(id, body, user);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role or not product owner' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser
  ): Promise<void> {
    return this.productsService.remove(id, user);
  }
}
