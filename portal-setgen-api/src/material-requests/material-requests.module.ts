import { Module } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [InventoryModule, AuditModule],
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService],
  exports: [MaterialRequestsService],
})
export class MaterialRequestsModule {}
