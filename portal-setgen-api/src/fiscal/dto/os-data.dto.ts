import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Item de Serviço (para NFS-e) ────────────────────────────────────────────

export class OsItemServicoDto {
  @ApiProperty({ example: 'Manutenção preventiva em gerador Cummins 150kVA' })
  @IsString()
  descricao: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @ApiProperty({ example: 4500.0 })
  @IsNumber()
  @Min(0)
  valorUnitario: number;

  /**
   * Alíquota ISS do município (regime legado).
   * Manaus: 2% a 5% conforme LC 157/2016 e lei municipal.
   * Default: 5%.
   */
  @ApiPropertyOptional({ example: 5, description: 'Alíquota ISS em %, ex: 5' })
  @IsOptional()
  @IsNumber()
  issAliquota?: number;

  /**
   * Código de Serviço LC116 (ex: "14.01" – manutenção de máquinas e equipamentos).
   */
  @ApiPropertyOptional({ example: '14.01' })
  @IsOptional()
  @IsString()
  codigoServico?: string;
}

// ─── Item de Peça / Mercadoria (para NF-e Modelo 55) ────────────────────────

export class OsItemPecaDto {
  @ApiProperty({ example: '8511.90.90', description: 'Código NCM de 8 dígitos' })
  @IsString()
  ncm: string;

  @ApiProperty({ example: 'Filtro de óleo para motor Cummins' })
  @IsString()
  descricao: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @ApiProperty({ example: 85.0 })
  @IsNumber()
  @Min(0)
  valorUnitario: number;

  /**
   * Indica se a peça foi fabricada na Zona Franca de Manaus.
   * Se true, aplica isenção ICMS e crédito presumido IBS/CBS.
   */
  @ApiPropertyOptional({
    example: true,
    description: 'Peça fabricada na ZFM? Activa benefícios fiscais.',
  })
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

// ─── Payload principal da OS ──────────────────────────────────────────────────

export class OsDataDto {
  @ApiProperty({ example: 'os-uuid-123' })
  @IsString()
  serviceOrderId: string;

  @ApiProperty({ example: '04.306.738/0001-95', description: 'CNPJ do cliente (destinatário)' })
  @IsString()
  clientCnpj: string;

  @ApiProperty({ example: '10.834.008/0001-68', description: 'CNPJ do emitente (sua empresa)' })
  @IsString()
  emitenteCnpj: string;

  @ApiProperty({ type: [OsItemServicoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OsItemServicoDto)
  itensServico: OsItemServicoDto[];

  @ApiProperty({ type: [OsItemPecaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OsItemPecaDto)
  itensPecas: OsItemPecaDto[];

  @ApiProperty({ enum: ['PRODUCAO', 'HOMOLOGACAO'], default: 'HOMOLOGACAO' })
  @IsEnum(['PRODUCAO', 'HOMOLOGACAO'])
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
}
