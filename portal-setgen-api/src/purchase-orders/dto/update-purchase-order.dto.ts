import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PurchaseOrderStatus } from '@prisma/client';

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {
  @ApiProperty({ enum: PurchaseOrderStatus, required: false })
  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;
}
