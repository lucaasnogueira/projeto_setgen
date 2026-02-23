import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '../../access-control/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';
export const RequiredPermissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
