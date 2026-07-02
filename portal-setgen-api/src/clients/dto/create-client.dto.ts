import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStatus, IcmsTaxpayerType } from '@prisma/client';

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

  @ApiProperty({ required: false, description: 'Código externo (chave de integração)' })
  @IsString()
  @IsOptional()
  externalCode?: string;

  @ApiProperty({ required: false, description: 'Responsável no local (falar com)' })
  @IsString()
  @IsOptional()
  onSiteContact?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  corporatePhones?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  corporateEmails?: string[];

  @ApiProperty({ required: false, description: 'Observação interna (não visível ao cliente)' })
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiProperty({ enum: IcmsTaxpayerType, required: false })
  @IsEnum(IcmsTaxpayerType)
  @IsOptional()
  icmsTaxpayerType?: IcmsTaxpayerType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  stateRegistration?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  municipalRegistration?: string;

  @ApiProperty({ required: false })
  @IsEmail({}, { message: 'E-mail de cobrança inválido' })
  @IsOptional()
  billingEmail?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ required: false, description: 'ID do colaborador (User) responsável' })
  @IsString()
  @IsOptional()
  responsibleUserId?: string;

  @ApiProperty({ required: false, description: 'ID da equipe responsável' })
  @IsString()
  @IsOptional()
  responsibleTeamId?: string;

  @ApiProperty({ required: false, description: 'ID do grupo de clientes (ClientTaxonomy kind=GROUP)' })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiProperty({ required: false, description: 'ID do segmento (ClientTaxonomy kind=SEGMENT)' })
  @IsString()
  @IsOptional()
  segmentId?: string;
}
