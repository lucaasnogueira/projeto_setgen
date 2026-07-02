import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { StatusNota, TipoNota } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FiscalFilterDto {
  @ApiPropertyOptional({ enum: StatusNota })
  @IsOptional()
  @IsEnum(StatusNota)
  status?: StatusNota;

  @ApiPropertyOptional({ enum: TipoNota })
  @IsOptional()
  @IsEnum(TipoNota)
  tipo?: TipoNota;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceOrderId?: string;
}
