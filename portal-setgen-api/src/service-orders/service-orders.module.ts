import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/service-orders',
    }),
  ],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
