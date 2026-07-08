import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { 
  EmployeeStatus, 
  Gender, 
  CivilStatus, 
  ContractType, 
  SalaryType, 
  WorkRegime, 
  AccountType, 
  HierarchicalLevel 
} from '@prisma/client';

export class CreateEmployeeDto {
  // 📌 1. Dados Pessoais
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({ example: 'Joana' })
  @IsString()
  @IsOptional()
  socialName?: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  @IsNotEmpty({ message: 'CPF é obrigatório' })
  cpf: string;

  @ApiPropertyOptional({ example: '12.345.678-9' })
  @IsString()
  @IsOptional()
  rg?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString({}, { message: 'Data de nascimento inválida' })
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: CivilStatus })
  @IsEnum(CivilStatus)
  @IsOptional()
  civilStatus?: CivilStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  birthPlace?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPcd?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pcdType?: string;

  // 📌 2. Contato
  @ApiPropertyOptional()
  @IsEmail({}, { message: 'E-mail pessoal inválido' })
  @IsOptional()
  personalEmail?: string;

  @ApiPropertyOptional()
  @IsEmail({}, { message: 'E-mail corporativo inválido' })
  @IsOptional()
  corporateEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobilePhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  landlinePhone?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  address?: any;

  // 📌 3. Dados Trabalhistas
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ctps?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pisPasep?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  voterId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  militaryCertificate?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString({}, { message: 'Data de admissão inválida' })
  @IsOptional()
  admissionDate?: string;

  @ApiPropertyOptional({ enum: ContractType })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workHours?: string;

  @ApiPropertyOptional({ example: 'Técnico de Campo' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  baseSalary?: number;

  @ApiPropertyOptional({ enum: SalaryType })
  @IsEnum(SalaryType)
  @IsOptional()
  salaryType?: SalaryType;

  @ApiPropertyOptional({ enum: WorkRegime })
  @IsEnum(WorkRegime)
  @IsOptional()
  workRegime?: WorkRegime;

  // 📌 4. Dados Financeiros
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bank?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  account?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pixKey?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  irDependents?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  benefitsPlan?: any;

  // 📌 5. Estrutura Organizacional
  @ApiPropertyOptional({ example: '12345' })
  @IsString()
  @IsOptional()
  registration?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  team?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  businessUnit?: string;

  @ApiPropertyOptional({ enum: HierarchicalLevel })
  @IsEnum(HierarchicalLevel)
  @IsOptional()
  hierarchicalLevel?: HierarchicalLevel;

  // 📌 6. Status do Colaborador
  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terminationReason?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsDateString({}, { message: 'Data de desligamento inválida' })
  @IsOptional()
  terminationDate?: string;

  // 📌 7. Dados de Acesso ao Sistema
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  login?: string;
}
