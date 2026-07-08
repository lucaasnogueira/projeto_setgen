import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectFuelRequestDto {
  @ApiProperty({ example: 'Preço acima da média de mercado, renegociar no posto.' })
  @IsString()
  @MinLength(10, { message: 'Motivo da rejeição deve ter no mínimo 10 caracteres' })
  rejectionReason: string;
}
