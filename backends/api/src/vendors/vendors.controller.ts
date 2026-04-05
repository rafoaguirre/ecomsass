import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  CreateVendorProfileRequest,
  UpdateVendorProfileRequest,
  VendorProfileResponse,
} from '@ecomsaas/contracts';
import {
  CreateVendorProfileRequestSchema,
  UpdateVendorProfileRequestSchema,
} from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@Controller('api/v1/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a vendor profile (become a vendor)' })
  @ApiCreatedResponse({ description: 'Vendor profile created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'User already has a vendor profile' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async create(
    @Body(new ZodValidationPipe(CreateVendorProfileRequestSchema))
    body: CreateVendorProfileRequest,
    @CurrentUser() user: AuthUser
  ): Promise<VendorProfileResponse> {
    return this.vendorsService.create({
      userId: user.id,
      ...body,
    });
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user vendor profile' })
  @ApiOkResponse({ description: 'Vendor profile returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  async getMe(@CurrentUser() user: AuthUser): Promise<VendorProfileResponse> {
    return this.vendorsService.getByUserId(user.id);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profile by ID' })
  @ApiOkResponse({ description: 'Vendor profile returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser
  ): Promise<VendorProfileResponse> {
    return this.vendorsService.getById(id, user);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a vendor profile' })
  @ApiOkResponse({ description: 'Vendor profile updated' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateVendorProfileRequestSchema))
    body: UpdateVendorProfileRequest,
    @CurrentUser() user: AuthUser
  ): Promise<VendorProfileResponse> {
    return this.vendorsService.update({ id, ...body }, user);
  }
}
