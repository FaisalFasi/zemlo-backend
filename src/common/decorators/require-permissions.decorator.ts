import { SetMetadata } from '@nestjs/common';

import type { PermissionName } from '../constants/permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const RequirePermissions = (...permissions: PermissionName[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
