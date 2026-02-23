import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nome do cargo', example: 'Supervisor de Campo' })
  @IsString()
  @IsNotEmpty({ message: 'O nome do cargo é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Descrição do cargo', example: 'Responsável pela equipe de técnicos' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Lista de IDs de permissões', example: ['users:view', 'orders:create'] })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}
