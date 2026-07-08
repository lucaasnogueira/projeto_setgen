import { Module } from '@nestjs/common';
import { FailureCategoriesService } from './failure-categories.service';
import { FailureCategoriesController } from './failure-categories.controller';

@Module({
  controllers: [FailureCategoriesController],
  providers: [FailureCategoriesService],
  exports: [FailureCategoriesService],
})
export class FailureCategoriesModule {}
