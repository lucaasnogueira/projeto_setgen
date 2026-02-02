import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/visits',
    }),
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
