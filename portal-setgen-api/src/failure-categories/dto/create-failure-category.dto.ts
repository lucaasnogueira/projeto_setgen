import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateFailureCategoryDto {
  @ApiProperty({ example: 'Falha de partida' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
