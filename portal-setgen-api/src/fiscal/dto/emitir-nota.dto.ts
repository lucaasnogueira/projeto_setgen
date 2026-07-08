import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Item de mercadoria (para NF-e Modelo 55) ───────────────────────────────

export class NotaFiscalItemDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  /**
   * Valor unitário de venda. Se omitido, usa o `unitCost` cadastrado no produto.
   */
  @ApiPropertyOptional({ example: 85.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorUnitario?: number;

  /**
   * Indica se a mercadoria foi fabricada na Zona Franca de Manaus.
   * Se true, aplica isenção ICMS e crédito presumido IBS/CBS.
   */
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fabricadoNaZfm?: boolean;

  /**
   * CFOP para operação (ex: 5.101 – venda dentro do estado).
   * Default: 5.102 (venda de mercadoria adquirida ou recebida de terceiros).
   */
  @ApiPropertyOptional({ example: '5.102' })
  @IsOptional()
  @IsString()
  cfop?: string;
}

// ─── Payload principal de emissão ────────────────────────────────────────────

export class EmitirNotaMercadoriaDto {
  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ example: 'service-order-uuid-here', description: 'Vínculo opcional com uma OS' })
  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @ApiProperty({ type: [NotaFiscalItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'A nota precisa de ao menos uma mercadoria' })
  @ValidateNested({ each: true })
  @Type(() => NotaFiscalItemDto)
  itens: NotaFiscalItemDto[];

  @ApiProperty({ enum: ['PRODUCAO', 'HOMOLOGACAO'], default: 'HOMOLOGACAO' })
  @IsEnum(['PRODUCAO', 'HOMOLOGACAO'])
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
}
