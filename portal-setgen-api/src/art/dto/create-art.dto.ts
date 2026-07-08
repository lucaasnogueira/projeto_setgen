import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class CreateArtDto {
  @ApiProperty({ example: 'service-order-uuid-here' })
  @IsUUID()
  @IsNotEmpty({ message: 'Ordem de Serviço é obrigatória' })
  serviceOrderId: string;

  @ApiProperty({ example: 'ART-2026-001234' })
  @IsString()
  @IsNotEmpty({ message: 'Número da ART é obrigatório' })
  number: string;

  @ApiProperty({ example: 'Eng. João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do responsável técnico é obrigatório' })
  engineerName: string;

  @ApiProperty({ example: 'SP-1234567890' })
  @IsString()
  @IsNotEmpty({ message: 'Número do CREA é obrigatório' })
  creaNumber: string;

  @ApiProperty({ example: '2026-07-05T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de emissão é obrigatória' })
  issueDate: string;
}
