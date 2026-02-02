import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus } from '@prisma/client';

class AddressDto {
  @ApiProperty()
  @IsString()
  cep: string;

  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsString()
  number: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty()
  @IsString()
  neighborhood: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  state: string;

  // Adicionar index signature para compatibilidade com Prisma JSON
  [key: string]: string | undefined;
}

export class CreateClientDto {
  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString()
  @IsNotEmpty({ message: 'CNPJ/CPF é obrigatório' })
  cnpjCpf: string;

  @ApiProperty({ example: 'Empresa XPTO LTDA' })
  @IsString()
  @IsNotEmpty({ message: 'Razão Social é obrigatória' })
  companyName: string;

  @ApiProperty({ example: 'XPTO', required: false })
  @IsString()
  @IsOptional()
  tradeName?: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ example: '(11) 98765-4321' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @ApiProperty({ example: 'contato@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string;

  @ApiProperty({ type: 'array', required: false, default: [] })
  @IsOptional()
  contacts?: any[];

  @ApiProperty({ enum: ClientStatus, default: ClientStatus.ACTIVE })
  @IsEnum(ClientStatus)
  @IsOptional()
  status?: ClientStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
