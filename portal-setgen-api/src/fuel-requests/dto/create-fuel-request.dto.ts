import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsNumber, Min, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFuelRequestDto {
  @ApiProperty({ example: 'vehicle-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Veículo é obrigatório' })
  vehicleId: string;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0.01, { message: 'Litros deve ser maior que zero' })
  @Type(() => Number)
  liters: number;

  @ApiProperty({ example: 6.19 })
  @IsNumber()
  @Min(0.01, { message: 'Preço por litro deve ser maior que zero' })
  @Type(() => Number)
  unitPrice: number;

  @ApiProperty({ example: 79430, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  currentKm?: number;

  @ApiProperty({ example: 'Posto Ipiranga - BR 101', required: false })
  @IsOptional()
  @IsString()
  fuelStation?: string;
}
