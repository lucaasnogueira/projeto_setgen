import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderDocumentsService } from './order-documents.service';
import { OrderDocumentsController } from './order-documents.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OrderDocumentsController],
  providers: [OrderDocumentsService],
  exports: [OrderDocumentsService],
})
export class OrderDocumentsModule {}

