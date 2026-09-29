import { PartialType } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';

// status muda só pelo endpoint dedicado PATCH /quotes/:id/status.
// clientId, type e technicalVisitId são aceitos para permitir edição de rascunhos (DRAFT).
export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}
