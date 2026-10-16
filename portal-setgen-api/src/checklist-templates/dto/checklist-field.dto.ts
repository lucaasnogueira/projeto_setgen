import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { ChecklistFieldType } from '@prisma/client';

export class ChecklistFieldDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: ChecklistFieldType })
  @IsEnum(ChecklistFieldType)
  type: ChecklistFieldType;

  @ApiProperty({ example: 'Equipamento instalado corretamente?' })
  @IsString()
  @IsNotEmpty({ message: 'Rótulo do campo é obrigatório' })
  label: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @ValidateIf((o) => o.section != null)
  section?: string;

  @ApiProperty({ required: false })
  @IsString()
  @ValidateIf((o) => o.unit != null)
  unit?: string;

  @ApiProperty({ type: [String], required: false, example: ['Opção A', 'Opção B'] })
  @ValidateIf((o) => o.options != null)
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @ValidateIf((o) => o.appliesTo != null)
  appliesTo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @ValidateIf((o) => o.formula != null)
  formula?: string;
}
