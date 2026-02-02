import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'service-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID da Ordem de Serviço é obrigatório' })
  serviceOrderId: string;

  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID do Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ example: 'OC-2024-001234' })
  @IsString()
  @IsNotEmpty({ message: 'Número da OC é obrigatório' })
  orderNumber: string;

  @ApiProperty({ example: 25000.0 })
  @IsNumber()
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  value: number;

  @ApiProperty({ example: '2024-01-30T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de emissão é obrigatória' })
  issueDate: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de validade é obrigatória' })
  expiryDate: string;
}
