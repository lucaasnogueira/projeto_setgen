import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { EquipmentType } from '@prisma/client';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Cliente é obrigatório' })
  clientId: string;

  @ApiProperty({ enum: EquipmentType, example: EquipmentType.GENERATOR })
  @IsEnum(EquipmentType, { message: 'Tipo de equipamento inválido' })
  type: EquipmentType;

  @ApiProperty({ example: 'Stemac', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'GS200', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'SN-12345', required: false })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ example: '200 kVA', required: false })
  @IsString()
  @IsOptional()
  powerRating?: string;

  @ApiProperty({ example: 'Casa de máquinas - térreo', required: false })
  @IsString()
  @IsOptional()
  installLocation?: string;

  @ApiProperty({ example: '2022-03-15T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ example: 'Equipamento de backup do CD', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
