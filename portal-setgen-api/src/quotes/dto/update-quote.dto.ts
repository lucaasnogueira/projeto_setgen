import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';

// status muda só pelo endpoint dedicado PATCH /quotes/:id/status.
//
// clientId, type e technicalVisitId ficam de fora: são a identidade do
// orçamento (numeração, visita de origem, cliente) e o serviço nunca os
// aplicou. Herdá-los fazia a API responder 200 para uma troca de cliente que
// não acontecia — agora o whitelist do ValidationPipe recusa com 400.
export class UpdateQuoteDto extends PartialType(
  OmitType(CreateQuoteDto, ['clientId', 'type', 'technicalVisitId'] as const),
) {}
