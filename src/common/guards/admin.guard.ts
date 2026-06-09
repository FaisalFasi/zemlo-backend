import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import type { AuthenticatedRequest } from '../types/authenticated-request.type';

/**
 * @deprecated Prefer JwtAuthGuard + PermissionsGuard + @RequirePermissions(...).
 * This guard is kept only for backwards compatibility while old admin routes are migrated.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const allowedRoles = new Set<UserRole>([
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);

    if (!allowedRoles.has(user.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
