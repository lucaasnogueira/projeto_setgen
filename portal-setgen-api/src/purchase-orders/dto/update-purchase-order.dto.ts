import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';

// `status` NÃO é editável: é derivado da validade (ver
// PurchaseOrdersService.resolveStatus). Aceitá-lo cru permitia marcar como
// EXPIRED uma OC ainda válida — o que liberava cadastrar uma segunda OC no
// mesmo orçamento, já que a checagem de "OC ativa" ignora as vencidas.
//
// quoteId e clientId também saem: o vínculo com o orçamento define de quem é a
// OC e nunca foi aplicado pelo serviço.
export class UpdatePurchaseOrderDto extends PartialType(
  OmitType(CreatePurchaseOrderDto, ['quoteId', 'clientId'] as const),
) {}
