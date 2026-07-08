import { Module } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { WarrantiesController } from './warranties.controller';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [WarrantiesController],
  providers: [WarrantiesService],
  exports: [WarrantiesService],
})
export class WarrantiesModule {}
