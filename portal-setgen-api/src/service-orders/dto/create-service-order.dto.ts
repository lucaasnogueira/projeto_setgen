import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ServiceOrderType } from '@prisma/client';

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
}
