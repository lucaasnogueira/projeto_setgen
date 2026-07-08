import { Module } from '@nestjs/common';
import { PublicQuotesController } from './public-quotes.controller';
import { PublicQuotesService } from './public-quotes.service';

@Module({
  controllers: [PublicQuotesController],
  providers: [PublicQuotesService],
})
export class PublicQuotesModule {}
