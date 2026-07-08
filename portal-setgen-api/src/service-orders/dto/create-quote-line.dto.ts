import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteLineType } from '@prisma/client';

export class CreateQuoteLineDto {
  @ApiProperty({ enum: QuoteLineType, example: QuoteLineType.SERVICE })
  @IsEnum(QuoteLineType, { message: 'Tipo de linha inválido' })
  type: QuoteLineType;

  @ApiProperty({ example: 'Troca de bateria do gerador' })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Quantidade deve ser maior que zero' })
  quantity: number;

  @ApiProperty({ example: 350.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Valor unitário não pode ser negativo' })
  unitValue: number;

  @ApiProperty({ example: 0, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Desconto não pode ser negativo' })
  @IsOptional()
  discount?: number;
}
