import { PartialType } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';

// status muda só pelo endpoint dedicado PATCH /quotes/:id/status
export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}
