import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategoryType, ExpenseGroup } from '@prisma/client';

export class CreateExpenseCategoryDto {
  @ApiProperty({ description: 'Nome da categoria de despesa', example: 'Combustível' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Código único da categoria', example: 'COMB', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ enum: ExpenseCategoryType, default: ExpenseCategoryType.OPERATIONAL })
  @IsEnum(ExpenseCategoryType)
  @IsOptional()
  type?: ExpenseCategoryType;

  @ApiProperty({ enum: ExpenseGroup, default: ExpenseGroup.SERVICE_EXPENSES })
  @IsEnum(ExpenseGroup)
  @IsOptional()
  group?: ExpenseGroup;

  @ApiProperty({ description: 'Descrição detalhada', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Cor em hexadecimal para badges e relatórios', example: '#E2661D', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Nome do ícone Lucide', example: 'Fuel', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Status ativo/inativo', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Orçamento padrão mensal', required: false })
  @IsNumber()
  @IsOptional()
  defaultBudget?: number;
}

