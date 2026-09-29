import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { AccessControlController } from './access-control.controller';

@Module({
  controllers: [RolesController, PermissionsController, AccessControlController],
  providers: [RolesService, PermissionsService],
  exports: [RolesService, PermissionsService],
})
export class AccessControlModule {}
