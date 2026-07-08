import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/visits',
    }),
    AuditModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
