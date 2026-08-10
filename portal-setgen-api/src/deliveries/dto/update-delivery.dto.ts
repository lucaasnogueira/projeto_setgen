import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDeliveryDto } from './create-delivery.dto';

// serviceOrderId não muda depois de registrada — a entrega é 1:1 com a OS e o
// serviço nunca aplicou esse campo. Herdá-lo fazia a API responder 200 para uma
// troca de OS que não acontecia.
export class UpdateDeliveryDto extends PartialType(
  OmitType(CreateDeliveryDto, ['serviceOrderId'] as const),
) {}
