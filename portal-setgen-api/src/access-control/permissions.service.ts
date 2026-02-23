import { Injectable } from '@nestjs/common';
import { PERMISSION_GROUPS } from './permissions.constants';

@Injectable()
export class PermissionsService {
  findAllGroups() {
    return PERMISSION_GROUPS;
  }

  findAllFlat() {
    return PERMISSION_GROUPS.flatMap((g) => g.permissions);
  }
}
