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

  @ApiProperty({ example: 500.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ example: 500.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ example: '8421.23.00', required: false })
  @IsString()
  @IsOptional()
  ncm?: string;

  @ApiProperty({ example: '7891234567890', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 'location-uuid-here', required: false })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  externalCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  associatedEquipmentId?: string;
}
