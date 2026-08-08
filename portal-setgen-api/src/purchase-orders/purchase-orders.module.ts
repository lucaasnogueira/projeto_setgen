import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { QuotesModule } from '../quotes/quotes.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/purchase-orders',
    }),
    QuotesModule,
    ServiceOrdersModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
