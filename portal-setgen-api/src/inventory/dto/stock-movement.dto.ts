import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID do produto é obrigatório' })
  productId: string;

  @ApiProperty({ enum: MovementType, example: MovementType.ENTRY })
  @IsEnum(MovementType, { message: 'Tipo de movimentação inválido' })
  type: MovementType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ example: 350.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiProperty({
    example: 'Recebimento de pedido #12345',
    required: false,
  })
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
}
