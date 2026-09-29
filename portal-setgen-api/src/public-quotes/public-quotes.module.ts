import { Module } from '@nestjs/common';
import { PublicQuotesController } from './public-quotes.controller';
import { PublicQuotesService } from './public-quotes.service';
import { QuotesModule } from '../quotes/quotes.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [QuotesModule, AuditModule],
  controllers: [PublicQuotesController],
  providers: [PublicQuotesService],
})
export class PublicQuotesModule {}
