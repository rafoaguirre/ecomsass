import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_CLIENT } from '../database';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    let dbStatus = 'ok';
    try {
      const { error } = await this.supabase
        .from('stores')
        .select('id', { count: 'exact', head: true });
      if (error) dbStatus = 'degraded';
    } catch {
      dbStatus = 'degraded';
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: { database: dbStatus },
    };
  }
}
