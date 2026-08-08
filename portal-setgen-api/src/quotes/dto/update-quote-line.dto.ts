import { PartialType } from '@nestjs/swagger';
import { CreateQuoteLineDto } from './create-quote-line.dto';

export class UpdateQuoteLineDto extends PartialType(CreateQuoteLineDto) {}
