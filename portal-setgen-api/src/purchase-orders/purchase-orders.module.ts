import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/purchase-orders',
    }),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
