import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EquipmentType } from '@prisma/client';

const emptyToUndefined = ({ value }: { value: any }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const dateEmptyToUndefined = ({ value }: { value: any }) =>
  value === '' || value === null ? undefined : value;

export class CreateEquipmentDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ enum: EquipmentType, example: EquipmentType.GENERATOR })
  @IsEnum(EquipmentType, { message: 'Tipo de equipamento inválido' })
  type: EquipmentType;

  @ApiProperty({ example: 'Gerador Principal', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'GER-001', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: 'Geradores Diesel', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'Stemac', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'GS200', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'SN-12345', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ example: '200 kVA', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  powerRating?: string;

  @ApiProperty({ example: 'Casa de máquinas - térreo', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  installLocation?: string;

  @ApiProperty({ example: '2022-03-15T00:00:00.000Z', required: false })
  @Transform(dateEmptyToUndefined)
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ example: '2025-03-15T00:00:00.000Z', required: false })
  @Transform(dateEmptyToUndefined)
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ example: '2025-03-15T00:00:00.000Z', required: false })
  @Transform(dateEmptyToUndefined)
  @IsDateString()
  @IsOptional()
  warrantyEndDate?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'Equipamento de backup do CD', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  specifications?: any;

  @ApiProperty({ required: false })
  @Transform(emptyToUndefined)
  @IsUUID()
  @IsOptional()
  parentEquipmentId?: string;
}
