import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceOrderType, PaymentMethod } from '@prisma/client';

export class CreateServiceOrderDto {
  @ApiProperty({
    enum: ServiceOrderType,
    example: ServiceOrderType.VISIT_REPORT,
  })
  @IsEnum(ServiceOrderType, { message: 'Tipo de OS inválido' })
  type: ServiceOrderType;

  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ example: 'visit-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  technicalVisitId?: string;

  @ApiProperty({ example: 'Instalação de infraestrutura de rede completa' })
  @IsString()
  @IsNotEmpty({ message: 'Escopo é obrigatório' })
  scope: string;

  @ApiProperty({ example: 'Internet lenta e oscilando', required: false })
  @IsString()
  @IsOptional()
  reportedDefects?: string;

  @ApiProperty({ example: 'Troca de cabos e reparo de conectores', required: false })
  @IsString()
  @IsOptional()
  requestedServices?: string;

  @ApiProperty({ example: 'Urgente: cliente sem acesso ao sistema financeiro', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: [
      { productId: 'prod-uuid', quantity: 2, unitPrice: 50.0 }
    ],
    required: false
  })
  @IsArray()
  @IsOptional()
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;

  @ApiProperty({
    example: {
      team: ['João Silva', 'Maria Santos'],
    },
    required: false,
  })
  @IsOptional()
  requiredResources?: {
    team?: string[];
  };

  @ApiProperty({ example: '2024-02-15T23:59:59.000Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({
    example: '2024-02-28T23:59:59.000Z',
    required: false,
    description: 'Validade do orçamento — usada para expiração automática após envio ao cliente',
  })
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiProperty({ example: ['tech-uuid-1', 'tech-uuid-2'], required: false })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  responsibleIds?: string[];

  @ApiProperty({
    example: [
      { item: 'Instalar switches', completed: false },
      { item: 'Configurar roteadores', completed: false },
    ],
    required: false,
  })
  @IsOptional()
  checklist?: Array<{ item: string; completed: boolean }>;

  @ApiProperty({ example: 'template-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  checklistTemplateId?: string;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    example: '50% entrada e 50% na conclusão',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiProperty({ example: 12, required: false, description: 'Meses de garantia — usado na entrega para gerar a Warranty' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @ApiProperty({ example: 'user-uuid-here', required: false, description: 'Colaborador responsável comercial pelo orçamento' })
  @IsUUID()
  @IsOptional()
  salesRepId?: string;

  @ApiProperty({ example: 30, required: false, description: 'Prazo de pagamento em dias, contado a partir da conclusão da OS — usado para previsão de recebíveis' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  paymentTermDays?: number;
}
