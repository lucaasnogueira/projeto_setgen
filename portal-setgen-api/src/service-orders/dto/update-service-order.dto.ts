import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';

// quoteId não muda depois de criada — 1:1 fixo com o orçamento de origem
export class UpdateServiceOrderDto extends PartialType(
  OmitType(CreateServiceOrderDto, ['quoteId'] as const),
) {}
