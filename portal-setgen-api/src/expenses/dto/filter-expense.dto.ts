import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseType, ExpenseStatus, PaymentMethod } from '@prisma/client';

export class FilterExpenseDto {
  // Período
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  competenceMonth?: string; // "2024-02"

  // Tipo e Status
  @IsOptional()
  @IsArray()
  @IsEnum(ExpenseType, { each: true })
  type?: ExpenseType[];

  @IsOptional()
  @IsArray()
  @IsEnum(ExpenseStatus, { each: true })
  status?: ExpenseStatus[];

  // Categorização
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryId?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  costCenterId?: string[];

  // Vínculos
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  visitId?: string;

  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  // Financeiro
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  paymentMethod?: PaymentMethod[];

  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAmount?: number;

  // Outros
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFixed?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  reconciled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Ordenação
  @IsOptional()
  @IsString()
  sortBy?: 'date' | 'amount' | 'dueDate' | 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // Paginação
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
