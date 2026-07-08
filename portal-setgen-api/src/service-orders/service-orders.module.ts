import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { AuditModule } from '../common/audit/audit.module';
import { MaterialRequestsModule } from '../material-requests/material-requests.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/service-orders',
    }),
    AuditModule,
    MaterialRequestsModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
