import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ example: 'FIORINO' })
  @IsString()
  @IsNotEmpty({ message: 'Nome/modelo do veículo é obrigatório' })
  name: string;

  @ApiProperty({ example: 'RFD2F55' })
  @IsString()
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  plate: string;

  @ApiProperty({ example: 97800, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  currentKm?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lastOilChangeKm?: number;

  @ApiProperty({ example: 10000, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  oilChangeIntervalKm?: number;
}
