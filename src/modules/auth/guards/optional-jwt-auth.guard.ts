import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { AuthenticatedUser } from '../../../common/types/authenticated-user.type';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      return true;
    }

    return true;
  }

  handleRequest<TUser = AuthenticatedUser | undefined>(
    err: unknown,
    user: TUser,
  ): TUser {
    if (err || !user) {
      return undefined as TUser;
    }

    return user;
  }
}
