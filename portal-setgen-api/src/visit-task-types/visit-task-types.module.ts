import { Module } from '@nestjs/common';
import { VisitTaskTypesService } from './visit-task-types.service';
import { VisitTaskTypesController } from './visit-task-types.controller';

@Module({
  controllers: [VisitTaskTypesController],
  providers: [VisitTaskTypesService],
  exports: [VisitTaskTypesService],
})
export class VisitTaskTypesModule {}
