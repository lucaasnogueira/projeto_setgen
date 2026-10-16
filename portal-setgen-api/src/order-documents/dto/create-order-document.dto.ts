import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '@prisma/client';

export class CreateOrderDocumentDto {
  @ApiProperty({ description: 'ID da Ordem de Serviço vinculada' })
  @IsString()
  @IsNotEmpty()
  serviceOrderId: string;

  @ApiProperty({ enum: DocumentType, description: 'Tipo do documento (CONTRACT, APR, WORK_PERMIT, ACCEPTANCE_TERM, TECHNICAL_REPORT, ART)' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiPropertyOptional({ description: 'Código do documento (ex: AP2026-001, PT2026-001)' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Título identificador do documento' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ enum: DocumentStatus, default: DocumentStatus.DRAFT })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiProperty({ description: 'Conteúdo estruturado do documento em formato JSON' })
  @IsNotEmpty()
  data: any;

  @ApiPropertyOptional({ description: 'Assinaturas digitais coletadas' })
  @IsOptional()
  signatures?: any;

  @ApiPropertyOptional({ description: 'URL de arquivo PDF anexado ou gerado' })
  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsString()
  @IsOptional()
  notes?: string;
}

