import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FinishTripDto {
  @ApiProperty({ example: 79430, description: 'KM do veículo na chegada' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  endKm: number;
}
