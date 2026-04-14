import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import type { RedisCache } from '@ecomsaas/infrastructure/cache';
import { SUPABASE_CLIENT } from '../database';
import { REDIS_CACHE_INSTANCE } from '../redis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    @Inject(REDIS_CACHE_INSTANCE)
    @Optional()
    private readonly redisCache: RedisCache | null | undefined
  ) {}

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

    let redisStatus = 'disabled';
    if (this.redisCache) {
      try {
        const alive = await this.redisCache.ping();
        redisStatus = alive ? 'ok' : 'degraded';
      } catch {
        redisStatus = 'degraded';
      }
    }

    const allChecks = { database: dbStatus, redis: redisStatus };
    const overallStatus = Object.values(allChecks).some((s) => s === 'degraded')
      ? 'degraded'
      : 'ok';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: allChecks,
    };
  }
}
