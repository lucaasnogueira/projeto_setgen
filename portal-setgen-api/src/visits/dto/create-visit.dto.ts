import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { VisitType, VisitPriority } from '@prisma/client';

// multipart/form-data manda campo repetido como array, mas com só 1 valor vira string solta
const toArray = ({ value }: { value: unknown }) =>
  value === undefined ? value : Array.isArray(value) ? value : [value];

export class CreateVisitDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ example: 'technician-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  technicianId?: string;

  @ApiProperty({
    example: ['equipment-uuid-1', 'equipment-uuid-2'],
    required: false,
    description: 'Equipamentos cobertos por esta visita',
  })
  @Transform(toArray)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  equipmentIds?: string[];

  @ApiProperty({ example: 'failure-category-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  failureCategoryId?: string;

  @ApiProperty({ example: 'task-type-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  taskTypeId?: string;

  @ApiProperty({ enum: VisitPriority, example: VisitPriority.MEDIUM, required: false })
  @IsEnum(VisitPriority, { message: 'Prioridade inválida' })
  @IsOptional()
  priority?: VisitPriority;

  @ApiProperty({ example: 'checklist-template-uuid-here', required: false })
  @IsUUID()
  @IsOptional()
  checklistTemplateId?: string;

  @ApiProperty({ example: 'AUVO-TASK-75420932', required: false })
  @IsString()
  @IsOptional()
  externalCode?: string;

  @ApiProperty({ example: 183.85, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  actualValue?: number;

  @ApiProperty({ example: '2024-01-30T14:30:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  scheduledStart?: string;

  @ApiProperty({ example: '2024-01-30T16:30:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @ApiProperty({ example: ['tech-uuid-1', 'tech-uuid-2'], required: false })
  @Transform(toArray)
  @IsString({ each: true })
  @IsOptional()
  responsibleIds?: string[];

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
    example: 'Relato do usuário sobre o problema...',
    required: false,
  })
  @IsString()
  @IsOptional()
  userReport?: string;

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
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  estimatedValue?: number;

  @ApiProperty({ example: 'Cliente solicitou urgência', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: ['Legenda 1', 'Legenda 2'], required: false })
  @Transform(toArray)
  @IsString({ each: true })
  @IsOptional()
  legends?: string[];
}
