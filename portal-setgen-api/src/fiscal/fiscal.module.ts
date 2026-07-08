import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { TaxEngineService } from './engines/tax-engine.service';
import { XmlGeneratorService } from './xml/xml-generator.service';
import { SignService } from './xml/sign.service';
import { NfeChaveService } from './xml/nfe-chave.service';
import { SefazAmService } from './sefaz/sefaz-am.service';
import { WebhookService } from './webhooks/webhook.service';

@Module({
  imports: [
    HttpModule.register({
      timeout:      30000,
      maxRedirects: 3,
    }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [FiscalController],
  providers: [
    FiscalService,
    TaxEngineService,
    XmlGeneratorService,
    NfeChaveService,
    SignService,
    SefazAmService,
    WebhookService,
  ],
  exports: [FiscalService],
})
export class FiscalModule {}
