import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceOrderType } from '@prisma/client';
import { ChecklistFieldDto } from './checklist-field.dto';

export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'Checklist de Instalação de Rede' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ServiceOrderType,
    required: false,
    description: 'Se omitido, aplica-se a qualquer tipo de OS',
  })
  @IsEnum(ServiceOrderType)
  @IsOptional()
  serviceOrderType?: ServiceOrderType;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ type: [ChecklistFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistFieldDto)
  fields: ChecklistFieldDto[];
}
