import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '@prisma/client';

export class BatchMovementItemDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID do produto é obrigatório' })
  productId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;
}

export class BatchMovementDto {
  @ApiProperty({
    enum: MovementType,
    example: MovementType.ENTRY,
    description: 'Tipo aplicado a todos os itens do lote',
  })
  @IsEnum(MovementType, { message: 'Tipo de movimentação inválido' })
  type: MovementType;

  @ApiProperty({ example: 'Recebimento NF 12345', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    example: 'service-order-uuid',
    description: 'ID de referência (OS, OC, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ type: [BatchMovementItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe ao menos um item' })
  @ValidateNested({ each: true })
  @Type(() => BatchMovementItemDto)
  items: BatchMovementItemDto[];
}
