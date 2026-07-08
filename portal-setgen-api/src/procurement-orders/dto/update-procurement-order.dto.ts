import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProcurementOrderDto } from './create-procurement-order.dto';

export class UpdateProcurementOrderDto extends PartialType(
  OmitType(CreateProcurementOrderDto, ['materialRequestId'] as const),
) {}
