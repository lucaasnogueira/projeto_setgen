import { Module } from '@nestjs/common';
import { ProcurementOrdersService } from './procurement-orders.service';
import { ProcurementOrdersController } from './procurement-orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { MaterialRequestsModule } from '../material-requests/material-requests.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [InventoryModule, MaterialRequestsModule, AuditModule],
  controllers: [ProcurementOrdersController],
  providers: [ProcurementOrdersService],
  exports: [ProcurementOrdersService],
})
export class ProcurementOrdersModule {}
