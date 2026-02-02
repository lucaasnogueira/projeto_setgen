import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/invoices',
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
