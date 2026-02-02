import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { VisitType } from '@prisma/client';

export class CreateVisitDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ example: 'technician-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Técnico é obrigatório' })
  technicianId: string;

  @ApiProperty({ example: '2024-01-30T14:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data da visita é obrigatória' })
  visitDate: string;

  @ApiProperty({ enum: VisitType, example: VisitType.TECHNICAL })
  @IsEnum(VisitType, { message: 'Tipo de visita inválido' })
  visitType: VisitType;

  @ApiProperty({ example: 'Rua Exemplo, 123 - Centro' })
  @IsString()
  @IsNotEmpty({ message: 'Local da visita é obrigatório' })
  location: string;

  @ApiProperty({
    example: 'Visita para levantamento de necessidades de infraestrutura',
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({
    example: 'Cliente precisa de upgrade de rede',
    required: false,
  })
  @IsString()
  @IsOptional()
  identifiedNeeds?: string;

  @ApiProperty({
    example: 'Instalação de novos switches e roteadores',
    required: false,
  })
  @IsString()
  @IsOptional()
  suggestedScope?: string;

  @ApiProperty({ example: '15 dias úteis', required: false })
  @IsString()
  @IsOptional()
  estimatedDeadline?: string;

  @ApiProperty({ example: 15000.0, required: false })
  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @ApiProperty({ example: 'Cliente solicitou urgência', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
