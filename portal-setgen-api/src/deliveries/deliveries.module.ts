import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/deliveries',
    }),
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
