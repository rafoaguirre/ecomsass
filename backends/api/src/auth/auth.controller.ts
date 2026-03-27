import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import type { AuthUser } from './types/auth-user';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  me(@CurrentUser() user: AuthUser | null) {
    return {
      user,
    };
  }

  @Get('vendor-check')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('Vendor', 'Admin')
  vendorCheck(@CurrentUser() user: AuthUser | null) {
    return {
      allowed: true,
      user,
    };
  }
}
