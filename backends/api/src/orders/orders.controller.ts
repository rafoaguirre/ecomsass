import {
  Body,
  Controller,
  Get,
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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type {
  CreateOrderRequest,
  OrderResponse,
  OrderListResponse,
  UpdateOrderStatusRequest,
} from '@ecomsaas/contracts';
import { OrderStatus } from '@ecomsaas/domain';
import {
  CreateOrderRequestSchema,
  UpdateOrderStatusRequestSchema,
} from '@ecomsaas/validation/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ParseOptionalEnumPipe } from '../common/pipes/parse-optional-enum.pipe';
import { OrdersService } from './orders.service';

const OrderStatusValues = Object.values(OrderStatus);

@ApiTags('orders')
@Controller('api/v1')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Customer endpoints ──────────────────────────────────────────────

  @Post('stores/:storeId/orders')
  @Roles('Customer', 'Buyer', 'Admin')
  @Throttle({ strict: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Place a new order in a store' })
  @ApiCreatedResponse({ description: 'Order placed successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Store or product not found' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  async create(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body(new ZodValidationPipe(CreateOrderRequestSchema)) body: CreateOrderRequest,
    @CurrentUser() user: AuthUser
  ): Promise<OrderResponse> {
    return this.ordersService.create(
      storeId,
      {
        items: body.items,
        paymentMethod: body.payment.method,
        fulfillment: {
          ...body.fulfillment,
          scheduledFor: body.fulfillment.scheduledFor
            ? new Date(body.fulfillment.scheduledFor)
            : undefined,
        },
        notes: body.notes,
        metadata: body.metadata,
      },
      user
    );
  }

  @Get('orders')
  @Roles('Customer', 'Buyer', 'Admin')
  @ApiOperation({ summary: 'List orders for the current customer' })
  @ApiOkResponse({ description: 'List of customer orders' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    schema: { type: 'string', enum: OrderStatusValues },
  })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listMyOrders(
    @CurrentUser() user: AuthUser,
    @Query('status', new ParseOptionalEnumPipe(OrderStatus, 'status')) status?: OrderStatus,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<OrderListResponse> {
    return this.ordersService.listForCustomer(user, {
      status,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('orders/:id')
  @Roles('Customer', 'Buyer', 'Vendor', 'Admin')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiOkResponse({ description: 'Order found and returned' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'No access to this order' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser
  ): Promise<OrderResponse> {
    return this.ordersService.getById(id, user);
  }

  // ── Vendor endpoints ────────────────────────────────────────────────

  @Get('stores/:storeId/orders')
  @Roles('Vendor', 'Admin')
  @ApiOperation({ summary: 'List orders for a store (vendor)' })
  @ApiOkResponse({ description: 'List of store orders' })
  @ApiForbiddenResponse({ description: 'You do not own this store' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    schema: { type: 'string', enum: OrderStatusValues },
  })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listStoreOrders(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: AuthUser,
    @Query('status', new ParseOptionalEnumPipe(OrderStatus, 'status')) status?: OrderStatus,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<OrderListResponse> {
    return this.ordersService.listForStore(storeId, user, {
      status,
      offset: offset ? parseInt(offset, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Put('orders/:id/status')
  @Roles('Vendor', 'Admin')
  @ApiOperation({ summary: 'Update order status (vendor)' })
  @ApiOkResponse({ description: 'Order status updated' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'You do not own this store' })
  @ApiUnprocessableEntityResponse({ description: 'Invalid status transition' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusRequestSchema)) body: UpdateOrderStatusRequest,
    @CurrentUser() user: AuthUser
  ): Promise<OrderResponse> {
    return this.ordersService.updateStatus(id, body, user);
  }
}
