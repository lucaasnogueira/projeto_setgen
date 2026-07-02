import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Equipe Sul' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ type: [String], required: false, description: 'IDs dos usuários membros' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}
