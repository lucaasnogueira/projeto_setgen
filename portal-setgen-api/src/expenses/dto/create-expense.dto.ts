import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseType, PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  description: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paidAmount?: number;

  @IsDateString()
  date: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsDateString()
  competenceDate: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  costCenterId?: string;

  // Vínculos operacionais
  @IsOptional()
  @IsString()
  visitId?: string;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringId?: string;

  // Novos campos
  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  installment?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalInstallments?: number;

  // Dias corridos (a partir de `date`) do vencimento de cada parcela a partir
  // da 2ª (ex.: compra parcelada em boletos de 15/30/45/60 dias -> [15,30,45,60]).
  // Se omitido, mantém o comportamento padrão de +1 mês por parcela.
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  installmentDaysOffsets?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;
}
