import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ example: 'OC-2026-0001' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiProperty({ example: 'Distribuidora Elétrica LTDA' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da loja ou fornecedor é obrigatório' })
  supplierName: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsString()
  @IsOptional()
  supplierCnpj?: string;

  @ApiPropertyOptional({ example: '(92) 3301-4455' })
  @IsString()
  @IsOptional()
  supplierPhone?: string;

  @ApiPropertyOptional({ example: 'Av. Constantino Nery, 1500 - Manaus/AM' })
  @IsString()
  @IsOptional()
  supplierAddress?: string;

  @ApiPropertyOptional({ example: 'supplier-uuid-here' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiProperty({ example: 'Lucas Silva (Técnico)' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do portador/responsável pela retirada é obrigatório' })
  carrierName: string;

  @ApiPropertyOptional({ example: '123.456.789-00' })
  @IsString()
  @IsOptional()
  carrierDoc?: string;

  @ApiPropertyOptional({ example: 'Strada Branca - Placa ABC-1234' })
  @IsString()
  @IsOptional()
  carrierVehicle?: string;

  @ApiPropertyOptional({ example: 'O.S. #1024 - Manutenção Hospital Santa Júlia' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({ example: 'service-order-uuid-here' })
  @IsString()
  @IsOptional()
  serviceOrderId?: string;

  @ApiPropertyOptional({ example: 'Boleto Faturado 28 Dias' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: [
      {
        description: 'Filtro de Óleo LF16015',
        code: 'LF-16015',
        quantity: 2,
        unit: 'UN',
        unitPrice: 180.0,
        total: 360.0,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  items?: any[];

  @ApiPropertyOptional({ example: 360.0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ example: 360.0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z' })
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-10-15T15:00:00.000Z' })
  @IsOptional()
  pickupDate?: string;

  @ApiPropertyOptional({ example: 'Liberar mercadoria com apresentação do crachá/documento.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsString()
  @IsOptional()
  pickupStatus?: string;
}
