import { Module } from '@nestjs/common';
import { FuelRequestsService } from './fuel-requests.service';
import { FuelRequestsController } from './fuel-requests.controller';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [ExpensesModule],
  controllers: [FuelRequestsController],
  providers: [FuelRequestsService],
  exports: [FuelRequestsService],
})
export class FuelRequestsModule {}
