import { PartialType } from '@nestjs/swagger';
import { CreateOrderDocumentDto } from './create-order-document.dto';

export class UpdateOrderDocumentDto extends PartialType(CreateOrderDocumentDto) {}

