import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'João Silva', required: false })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'joao@setgen.com', required: false })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  email?: string;
}
