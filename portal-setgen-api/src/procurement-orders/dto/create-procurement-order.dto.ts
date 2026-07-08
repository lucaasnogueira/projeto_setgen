import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProcurementOrderItemDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 45.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreateProcurementOrderDto {
  @ApiProperty({ example: 'supplier-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiProperty({ example: 'material-request-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  materialRequestId?: string;

  @ApiProperty({ example: '2026-08-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @ApiProperty({ type: [ProcurementOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcurementOrderItemDto)
  items: ProcurementOrderItemDto[];
}
