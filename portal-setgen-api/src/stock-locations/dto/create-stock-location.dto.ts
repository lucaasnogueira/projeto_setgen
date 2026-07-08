import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStockLocationDto {
  @ApiProperty({ example: 'A-3' })
  @IsString()
  @IsNotEmpty({ message: 'Código do local é obrigatório' })
  code: string;

  @ApiProperty({ example: 'Prateleira A, nível 3', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
