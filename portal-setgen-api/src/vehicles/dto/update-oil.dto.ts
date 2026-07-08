import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOilDto {
  @ApiProperty({ example: 97800, description: 'KM do veículo no momento da troca de óleo' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lastOilChangeKm: number;

  @ApiProperty({ example: 10000, description: 'Intervalo entre trocas, em KM' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  oilChangeIntervalKm: number;
}
