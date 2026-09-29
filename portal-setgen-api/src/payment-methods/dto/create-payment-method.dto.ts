import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @IsNumber({}, { message: 'Número máximo de parcelas deve ser numérico' })
  @Min(1, { message: 'Número de parcelas deve ser de no mínimo 1' })
  @Type(() => Number)
  maxInstallments: number;

  @IsString()
  @IsNotEmpty({ message: 'Conta bancária é obrigatória' })
  bankAccount: string;

  @IsString()
  @IsNotEmpty({ message: 'Modalidade de pagamento é obrigatória' })
  gatewayOrModality: string;

  @IsOptional()
  @IsNumber({}, { message: 'Alíquota deve ser numérica' })
  @Min(0)
  @Type(() => Number)
  feePercentage?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Valor fixo deve ser numérico' })
  @Min(0)
  @Type(() => Number)
  feeFixedAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Prazo de recebimento deve ser numérico' })
  @Min(0)
  @Type(() => Number)
  settlementPeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

