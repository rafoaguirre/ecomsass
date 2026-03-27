import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { SupabaseClient } from '@ecomsaas/infrastructure/database';
import { SUPABASE_ANON_CLIENT } from '../../database';
import type { AuthUser } from '../types/auth-user';

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    @Inject(SUPABASE_ANON_CLIENT)
    private readonly supabase: SupabaseClient
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const token = this.extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      role: this.extractRole(data.user.app_metadata),
    };

    return true;
  }

  private extractBearerToken(authorizationHeader: string | string[] | undefined): string | null {
    const header = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (!header) {
      return null;
    }

    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private extractRole(appMetadata: Record<string, unknown> | undefined): string | null {
    if (!appMetadata) {
      return null;
    }

    const role = appMetadata['role'];
    return typeof role === 'string' ? role : null;
  }
}
