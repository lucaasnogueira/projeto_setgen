import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @IsNotEmpty({ message: 'Código do produto é obrigatório' })
  code: string;

  @ApiProperty({ example: 'Switch 24 Portas Gigabit' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'Switch gerenciável com 24 portas Gigabit Ethernet',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'UN',
    description: 'Unidade de medida (UN, KG, M, L, etc.)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Unidade é obrigatória' })
  unit: string;

  @ApiProperty({ example: 5, description: 'Estoque mínimo para alerta' })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ example: 10, description: 'Estoque atual', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiProperty({ example: 350.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;
}
