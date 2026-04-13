import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, errors as joseErrors } from 'jose';
import { UserRole } from '@ecomsaas/domain';
import { extractBearerToken } from '../../common/auth/extract-bearer-token';
import type { AuthUser } from '../types/auth-user';

const VALID_ROLES = new Set<string>(Object.values(UserRole));

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

interface SupabaseJwtPayload {
  sub?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwtSecret: Uint8Array | undefined;

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const token = extractBearerToken(request.headers?.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const secret = this.getJwtSecret();
      const { payload } = await jwtVerify<SupabaseJwtPayload>(token, secret);

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token: missing subject');
      }

      request.user = {
        id: payload.sub,
        email: payload.email ?? null,
        role: this.extractRole(payload.app_metadata) ?? UserRole.Customer,
      };

      return true;
    } catch (err) {
      if (err instanceof joseErrors.JWTExpired) {
        throw new UnauthorizedException('Token has expired');
      }
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private getJwtSecret(): Uint8Array {
    if (!this.jwtSecret) {
      const secret = this.config.getOrThrow<string>('SUPABASE_JWT_SECRET');
      this.jwtSecret = new TextEncoder().encode(secret);
    }
    return this.jwtSecret;
  }

  private extractRole(metadata: Record<string, unknown> | undefined): string | null {
    if (!metadata) {
      return null;
    }

    const role = metadata['role'];
    if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
      return null;
    }
    return role;
  }
}
