import { Module } from '@nestjs/common';
import { ClientTaxonomiesService } from './client-taxonomies.service';
import { ClientTaxonomiesController } from './client-taxonomies.controller';

@Module({
  controllers: [ClientTaxonomiesController],
  providers: [ClientTaxonomiesService],
  exports: [ClientTaxonomiesService],
})
export class ClientTaxonomiesModule {}
