import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuidora Elétrica Ltda' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ example: '12.345.678/0001-90', required: false })
  @IsString()
  @IsOptional()
  cnpj?: string;

  @ApiProperty({ example: 'Carlos Vendas', required: false })
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiProperty({ example: 'vendas@distribuidora.com', required: false })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '(11) 3456-7890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
