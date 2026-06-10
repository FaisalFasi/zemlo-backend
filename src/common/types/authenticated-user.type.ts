import { UserRole } from '@prisma/client';

import type { PermissionName } from '../constants/permissions';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  sessionId: string;
  permissions: PermissionName[];
}
