import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [Reflector, SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
