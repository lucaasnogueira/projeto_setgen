import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Título do serviço é obrigatório' })
  title: string;

  @IsNumber({}, { message: 'Preço deve ser um número válido' })
  @Min(0, { message: 'Preço não pode ser negativo' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  externalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Observação não pode exceder 10.000 caracteres' })
  defaultObservation?: string;

  @IsOptional()
  @IsBoolean()
  observationEditable?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

