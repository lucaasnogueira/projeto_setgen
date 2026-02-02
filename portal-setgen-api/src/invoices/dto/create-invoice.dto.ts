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

export class CreateInvoiceDto {
  @ApiProperty({ example: 'service-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID da Ordem de Serviço é obrigatório' })
  serviceOrderId: string;

  @ApiProperty({ example: 'purchase-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'ID da Ordem de Compra é obrigatório' })
  purchaseOrderId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: 'Número da NF é obrigatório' })
  invoiceNumber: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty({ message: 'Série da NF é obrigatória' })
  series: string;

  @ApiProperty({ example: 25000.0 })
  @IsNumber()
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  value: number;

  @ApiProperty({ example: '2024-01-30T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de emissão é obrigatória' })
  issueDate: string;

  @ApiProperty({ example: '2024-02-28T23:59:59.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória' })
  dueDate: string;
}
