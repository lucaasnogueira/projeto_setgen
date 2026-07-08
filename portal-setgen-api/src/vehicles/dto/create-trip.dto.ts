import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripDto {
  @ApiProperty({ example: 'employee-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Motorista é obrigatório' })
  driverId: string;

  @ApiProperty({ example: 'Loja Varejão Baby' })
  @IsString()
  @IsNotEmpty({ message: 'Destino é obrigatório' })
  destination: string;

  @ApiProperty({ example: 79363 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  startKm: number;
}
