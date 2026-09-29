import { Module } from '@nestjs/common';
import { SystemModulesService } from './system-modules.service';
import { SystemModulesController } from './system-modules.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemModulesController],
  providers: [SystemModulesService],
  exports: [SystemModulesService],
})
export class SystemModulesModule {}
