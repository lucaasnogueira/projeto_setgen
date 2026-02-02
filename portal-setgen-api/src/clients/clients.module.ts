import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { CnpjService } from './cnpj.service';

@Module({
  imports: [HttpModule],
  controllers: [ClientsController],
  providers: [ClientsService, CnpjService],
  exports: [ClientsService],
})
export class ClientsModule {}
