import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ASOType } from '@prisma/client';

export class CreateASODto {
  @ApiProperty({ enum: ASOType })
  @IsEnum(ASOType, { message: 'Tipo de ASO inválido' })
  @IsNotEmpty({ message: 'Tipo de ASO é obrigatório' })
  type: ASOType;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString({}, { message: 'Data do exame inválida' })
  @IsNotEmpty({ message: 'Data do exame é obrigatória' })
  examDate: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsDateString({}, { message: 'Data de vencimento inválida' })
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'APTO' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiProperty({ example: 'employee-id' })
  @IsString()
  @IsNotEmpty({ message: 'ID do funcionário é obrigatório' })
  employeeId: string;
}
