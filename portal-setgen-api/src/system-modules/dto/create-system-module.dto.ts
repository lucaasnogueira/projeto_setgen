import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateSystemModuleDto {
  @ApiProperty({ description: 'Nome do módulo', example: 'Armazém Geral' })
  @IsNotEmpty({ message: 'Nome do módulo é obrigatório' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Código único do módulo', example: 'WAREHOUSE' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Descrição da finalidade do módulo', example: 'Módulo de Armazém Geral' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Rota do módulo', example: '/inventory' })
  @IsNotEmpty({ message: 'Rota do módulo é obrigatória' })
  @IsString()
  route: string;

  @ApiPropertyOptional({ description: 'Nome do ícone (Lucide)', example: 'Truck' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Ordem de exibição', example: 1 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Indica se o módulo está ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
