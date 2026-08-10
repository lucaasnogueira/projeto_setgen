import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceOrderItemDto {
  @ApiProperty({ example: 'prod-uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantidade prevista — inteiro positivo' })
  @Type(() => Number)
  @IsInt({ message: 'Quantidade deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ example: 50.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Valor unitário não pode ser negativo' })
  unitPrice: number;
}
